"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import type { FieldErrors, FormState } from "@/lib/form-state";
import { syncSubscriptionSchedules } from "@/lib/notifications/scheduler";
import { requirePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChangePasswordSchema, UpdateNotificationPreferencesSchema, type UpdateNotificationPreferencesInput } from "@/lib/validations/settings";
import type { Database } from "@/types/database";

const fieldErrorsOf = (issues: { path: PropertyKey[]; message: string }[]): FieldErrors => {
  const errors: FieldErrors = {};
  for (const issue of issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
};

/**
 * 전역 알림 설정 저장 후, 기본 설정을 쓰는 활성 구독의 예약 알림을 새 설정으로 다시 맞춘다.
 * 같은 값을 다시 보내도 결과가 같다 (멱등).
 */
export async function updateNotificationPreferencesAction(input: UpdateNotificationPreferencesInput): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { status: "error", code: "UNAUTHORIZED", message: "로그인이 필요해요. 다시 로그인해 주세요." };
  const userId = auth.user.id;

  const parsed = UpdateNotificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", code: "VALIDATION_ERROR", message: "입력한 내용을 확인해 주세요.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }
  const { isEnabled, remindDays, dispatchTime } = parsed.data;

  const { error } = await supabase
    .from("notification_preferences")
    .upsert({ user_id: userId, is_enabled: isEnabled, remind_days: [...remindDays].sort((a, b) => a - b), dispatch_time: `${dispatchTime}:00` }, { onConflict: "user_id" });
  if (error) {
    console.error("[settings] preferences upsert failed", { code: error.code });
    return { status: "error", code: "SAVE_FAILED", message: "설정을 저장하지 못했어요. 다시 시도해 주세요." };
  }

  const { data: subscriptions, error: listError } = await supabase
    .from("subscriptions")
    .select("id, next_billing_date, status, use_custom_alert, custom_alert_days, custom_alert_time")
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .eq("use_custom_alert", false);
  let resyncFailed = Boolean(listError);
  for (const subscription of subscriptions ?? []) {
    try {
      await syncSubscriptionSchedules({
        subscriptionId: subscription.id,
        userId,
        nextBillingDate: subscription.next_billing_date,
        status: subscription.status,
        useCustomAlert: subscription.use_custom_alert,
        customAlertDays: subscription.custom_alert_days,
        customAlertTime: subscription.custom_alert_time,
      });
    } catch (syncError) {
      console.error("[settings] schedule resync failed", syncError instanceof Error ? syncError.message : syncError);
      resyncFailed = true;
    }
  }

  revalidatePath("/settings/profile");
  if (resyncFailed) {
    return { status: "error", code: "RESYNC_FAILED", message: "설정은 저장했지만 일부 구독의 알림 예약을 바꾸지 못했어요. 다시 저장해 주세요." };
  }
  return { status: "success", message: "알림 설정을 저장했어요." };
}

/** 현재 비밀번호를 확인한 뒤 새 비밀번호로 바꾼다 (이메일 계정 전용). 현재 세션은 유지된다. */
export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email) return { status: "error", code: "UNAUTHORIZED", message: "로그인이 필요해요. 다시 로그인해 주세요." };

  const value = (name: string) => {
    const raw = formData.get(name);
    return typeof raw === "string" ? raw : "";
  };
  const parsed = ChangePasswordSchema.safeParse({ currentPassword: value("currentPassword"), newPassword: value("newPassword"), confirmPassword: value("confirmPassword") });
  if (!parsed.success) {
    return { status: "error", code: "VALIDATION_ERROR", message: "입력한 내용을 확인해 주세요.", fieldErrors: fieldErrorsOf(parsed.error.issues) };
  }

  // 쿠키를 쓰지 않는 별도 클라이언트로 현재 비밀번호를 확인하고, 확인용으로 생긴 세션은 바로 폐기한다
  const verifier = createClient<Database>(requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"), requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({ email: auth.user.email, password: parsed.data.currentPassword });
  if (verifyError) {
    if (verifyError.code === "invalid_credentials") {
      return {
        status: "error",
        code: "INVALID_CURRENT_PASSWORD",
        message: "입력한 내용을 확인해 주세요.",
        fieldErrors: { currentPassword: "현재 비밀번호가 일치하지 않습니다. 다시 확인해 주세요." },
      };
    }
    if (verifyError.code === "over_request_rate_limit") {
      return { status: "error", code: "RATE_LIMITED", message: "요청이 많아요. 잠시 후 다시 시도해 주세요." };
    }
    console.error("[settings] password verify failed", { code: verifyError.code, status: verifyError.status });
    return { status: "error", code: "CHANGE_FAILED", message: "비밀번호를 변경하지 못했어요. 다시 시도해 주세요." };
  }
  const { error: cleanupError } = await verifier.auth.signOut({ scope: "local" });
  if (cleanupError) console.error("[settings] verifier session cleanup failed", { code: cleanupError.code });

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    if (error.code === "weak_password") {
      return { status: "error", code: "WEAK_PASSWORD", message: "입력한 내용을 확인해 주세요.", fieldErrors: { newPassword: "더 안전한 비밀번호를 사용해 주세요." } };
    }
    console.error("[settings] password update failed", { code: error.code, status: error.status });
    return { status: "error", code: "CHANGE_FAILED", message: "비밀번호를 변경하지 못했어요. 다시 시도해 주세요." };
  }
  console.info("[settings] password changed", { userId: auth.user.id });
  return { status: "success", message: "비밀번호를 변경했어요. 다음 로그인부터 새 비밀번호를 사용해 주세요." };
}
