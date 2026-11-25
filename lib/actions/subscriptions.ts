"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FieldErrors, FormState } from "@/lib/form-state";
import { syncSubscriptionSchedules, type SyncScheduleOptions } from "@/lib/notifications/scheduler";
import { parseCalendarDate } from "@/lib/billing/cycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubscriptionInsertSchema } from "@/lib/validations/schema";

const SubscriptionIdSchema = z.uuid("올바른 구독 식별자 형식이 아닙니다.");

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};
const optionalText = (formData: FormData, name: string) => {
  const value = text(formData, name).trim();
  return value === "" ? null : value;
};

/** 폼 값 → 검증 입력. billing_day는 사용자가 아니라 서버가 정한다. */
function readForm(formData: FormData, billingDay: number) {
  const amountText = text(formData, "amount").replace(/,/g, "").trim();
  return {
    preset_id: optionalText(formData, "preset_id"),
    service_name: text(formData, "service_name"),
    category: text(formData, "category"),
    amount: amountText === "" ? undefined : Number(amountText),
    currency: text(formData, "currency") || undefined,
    billing_cycle: text(formData, "billing_cycle") || undefined,
    billing_day: billingDay,
    next_billing_date: text(formData, "next_billing_date"),
    payment_method_memo: optionalText(formData, "payment_method_memo"),
    memo: optionalText(formData, "memo"),
    status: text(formData, "status") || "ACTIVE",
  };
}

function validationError(error: z.ZodError): FormState {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", code: "VALIDATION_ERROR", message: "입력한 내용을 확인해 주세요.", fieldErrors };
}

const SAVE_FAILED: FormState = { status: "error", code: "SAVE_FAILED", message: "구독 저장 중 오류가 발생했습니다. 다시 시도해 주세요." };
const UNAUTHORIZED: FormState = { status: "error", code: "UNAUTHORIZED", message: "로그인이 필요해요. 다시 로그인해 주세요." };
const PRESET_GONE: FormState = {
  status: "error",
  code: "PRESET_NOT_FOUND",
  message: "선택한 인기 서비스 정보가 바뀌었어요. 화면을 새로고침한 뒤 다시 선택해 주세요.",
};
const NOT_FOUND: FormState = { status: "error", code: "NOT_FOUND", message: "구독 정보를 찾을 수 없습니다." };

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

/** 알림 예약 동기화. 구독 저장은 이미 끝났으므로 실패해도 저장을 되돌리지 않고 화면에 알린다. */
async function syncSchedulesSafely(options: SyncScheduleOptions): Promise<boolean> {
  try {
    await syncSubscriptionSchedules(options);
    return true;
  } catch (error) {
    console.error("[subscriptions] schedule sync failed", error instanceof Error ? error.message : error);
    return false;
  }
}

function revalidateSubscriptionViews(id?: string) {
  revalidatePath("/subscriptions");
  revalidatePath("/home");
  if (id) revalidatePath(`/subscriptions/${id}`);
}

export async function createSubscriptionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return UNAUTHORIZED;

  // 날짜가 잘못됐으면 next_billing_date 검증 오류로 안내되므로 billing_day는 임시값
  const date = parseCalendarDate(text(formData, "next_billing_date"));
  const parsed = SubscriptionInsertSchema.safeParse(readForm(formData, date?.day ?? 1));
  if (!parsed.success) return validationError(parsed.error);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({ ...parsed.data, user_id: userId })
    .select("id, next_billing_date, status, use_custom_alert, custom_alert_days, custom_alert_time")
    .single();
  if (error) {
    console.error("[subscriptions] insert failed", { code: error.code });
    // 선택한 프리셋이 더 이상 없음 (오래된 화면·캐시)
    if (error.code === "23503") return PRESET_GONE;
    return SAVE_FAILED;
  }

  const scheduled = await syncSchedulesSafely({
    subscriptionId: data.id,
    userId,
    nextBillingDate: data.next_billing_date,
    status: data.status,
    useCustomAlert: data.use_custom_alert,
    customAlertDays: data.custom_alert_days,
    customAlertTime: data.custom_alert_time,
  });
  revalidateSubscriptionViews();
  redirect(`/subscriptions?saved=created${scheduled ? "" : "&notify=failed"}`);
}

export async function updateSubscriptionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return UNAUTHORIZED;

  const id = SubscriptionIdSchema.safeParse(text(formData, "id"));
  if (!id.success) return NOT_FOUND;

  // 소유권 확인 + 기존 청구 기준일 조회 (클라이언트가 보낸 id는 권한 증빙이 아님)
  const { data: existing, error: readError } = await supabase
    .from("subscriptions")
    .select("billing_day, next_billing_date")
    .eq("id", id.data)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) {
    console.error("[subscriptions] ownership check failed", { code: readError.code });
    return SAVE_FAILED;
  }
  if (!existing) return NOT_FOUND;

  // 결제 예정일이 바뀐 경우에만 청구 기준일을 다시 정한다 (31일 구독이 30일로 보정된 날짜를 유지하는 경우 보호)
  const date = text(formData, "next_billing_date");
  const billingDay = date === existing.next_billing_date ? existing.billing_day : (parseCalendarDate(date)?.day ?? existing.billing_day);

  const parsed = SubscriptionInsertSchema.safeParse(readForm(formData, billingDay));
  if (!parsed.success) return validationError(parsed.error);

  const { data: saved, error } = await supabase
    .from("subscriptions")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("user_id", userId)
    .select("next_billing_date, status, use_custom_alert, custom_alert_days, custom_alert_time")
    .single();
  if (error) {
    console.error("[subscriptions] update failed", { code: error.code });
    if (error.code === "23503") return PRESET_GONE;
    return SAVE_FAILED;
  }

  const scheduled = await syncSchedulesSafely({
    subscriptionId: id.data,
    userId,
    nextBillingDate: saved.next_billing_date,
    status: saved.status,
    useCustomAlert: saved.use_custom_alert,
    customAlertDays: saved.custom_alert_days,
    customAlertTime: saved.custom_alert_time,
  });
  revalidateSubscriptionViews(id.data);
  redirect(`/subscriptions/${id.data}?saved=updated${scheduled ? "" : "&notify=failed"}`);
}

export async function deleteSubscriptionAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await currentUser();
  if (!userId) return UNAUTHORIZED;

  const id = SubscriptionIdSchema.safeParse(text(formData, "id"));
  if (!id.success) return NOT_FOUND;

  // 본인 행만 삭제. 이미 없으면 0행이어도 성공으로 본다 (멱등). 예약된 알림은 FK cascade로 함께 삭제되어 발송되지 않는다.
  const { error } = await supabase.from("subscriptions").delete().eq("id", id.data).eq("user_id", userId);
  if (error) {
    console.error("[subscriptions] delete failed", { code: error.code });
    return { status: "error", code: "DELETE_FAILED", message: "구독을 삭제하지 못했어요. 다시 시도해 주세요." };
  }

  revalidateSubscriptionViews(id.data);
  redirect("/subscriptions?saved=deleted");
}
