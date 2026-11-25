"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateNextBillingDate, parseCalendarDate } from "@/lib/billing/cycle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ConfirmPaymentInputSchema = z.object({
  subscriptionId: z.uuid("올바른 구독 식별자 형식이 아닙니다."),
  expectedCurrentNextBillingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 이어야 합니다."),
});

export type ConfirmPaymentInput = z.infer<typeof ConfirmPaymentInputSchema>;

export type ConfirmPaymentResult =
  | { success: true; nextBillingDate: string; message: string }
  | {
      success: false;
      error: { code: "UNAUTHORIZED" | "NOT_FOUND" | "CONCURRENT_UPDATE" | "INVALID_STATUS" | "INTERNAL_ERROR" | "VALIDATION_ERROR"; message: string };
    };

const FAILED = "결제 완료 처리에 실패했습니다. 다시 시도해 주세요.";
const fail = (code: Extract<ConfirmPaymentResult, { success: false }>["error"]["code"], message: string): ConfirmPaymentResult => ({
  success: false,
  error: { code, message },
});

/**
 * 결제 완료 확인: 확인한 날이 아니라 기존 결제 예정일을 기준으로 한 주기 뒤로 갱신한다 (말일 보정 포함).
 * expectedCurrentNextBillingDate와 DB 값이 다르면 이미 처리된 것으로 보고 다시 가산하지 않는다 (멱등·동시성).
 */
export async function confirmSubscriptionPaymentAction(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
  const parsed = ConfirmPaymentInputSchema.safeParse(input);
  if (!parsed.success) return fail("VALIDATION_ERROR", FAILED);
  const { subscriptionId, expectedCurrentNextBillingDate } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return fail("UNAUTHORIZED", "로그인이 필요해요. 다시 로그인해 주세요.");
  const userId = auth.user.id;

  const { data: current, error: readError } = await supabase
    .from("subscriptions")
    .select("billing_cycle, billing_day, next_billing_date, status")
    .eq("id", subscriptionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (readError) {
    console.error("[payments] read failed", { code: readError.code });
    return fail("INTERNAL_ERROR", FAILED);
  }
  if (!current) return fail("NOT_FOUND", "구독 정보를 찾을 수 없습니다.");
  if (current.status !== "ACTIVE") return fail("INVALID_STATUS", "이용 중인 구독만 결제 완료로 처리할 수 있어요.");

  if (current.next_billing_date !== expectedCurrentNextBillingDate) {
    return { success: true, nextBillingDate: current.next_billing_date, message: "이미 처리된 결제예요." };
  }

  const billingDay = current.billing_day ?? parseCalendarDate(current.next_billing_date)?.day ?? 1;
  const nextBillingDate = calculateNextBillingDate({
    currentDate: current.next_billing_date,
    billingCycle: current.billing_cycle,
    billingDay,
  });

  // 조회 이후 다른 요청이 먼저 갱신했다면 0행 → 다시 읽어 그 결과를 돌려준다
  const { data: updated, error: updateError } = await supabase
    .from("subscriptions")
    .update({ next_billing_date: nextBillingDate })
    .eq("id", subscriptionId)
    .eq("user_id", userId)
    .eq("next_billing_date", expectedCurrentNextBillingDate)
    .select("next_billing_date");
  if (updateError) {
    console.error("[payments] update failed", { code: updateError.code });
    return fail("INTERNAL_ERROR", FAILED);
  }

  revalidatePath("/home");
  revalidatePath("/subscriptions");
  revalidatePath(`/subscriptions/${subscriptionId}`);

  if (updated.length === 0) {
    const { data: latest } = await supabase.from("subscriptions").select("next_billing_date").eq("id", subscriptionId).eq("user_id", userId).maybeSingle();
    if (!latest) return fail("NOT_FOUND", "구독 정보를 찾을 수 없습니다.");
    return { success: true, nextBillingDate: latest.next_billing_date, message: "이미 처리된 결제예요." };
  }
  return { success: true, nextBillingDate, message: "결제 완료로 처리했어요." };
}
