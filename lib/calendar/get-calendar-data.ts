import "server-only";

import { readTimeout } from "@/lib/data/read-timeout";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildCalendarProjection, monthEnd, monthStart, type MonthlyCalendarProjection } from "./calendar-utils";
import { CalendarQuerySchema } from "./query";

/** 로그인 사용자의 해당 월 결제 일정 (활성 구독만, DB 조건으로 제외) */
export async function getCalendarMonthlySchedules(input: { year: number; month: number }, today: string): Promise<MonthlyCalendarProjection> {
  const { year, month } = CalendarQuerySchema.parse(input);
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("로그인이 필요합니다.");

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, service_name, category, amount, currency, billing_cycle, payment_method_memo, next_billing_date, status")
    .eq("user_id", auth.user.id)
    .eq("status", "ACTIVE")
    .gte("next_billing_date", monthStart(year, month))
    .lte("next_billing_date", monthEnd(year, month))
    .abortSignal(readTimeout());
  if (error) {
    console.error("[calendar] query failed", { code: error.code });
    throw new Error("일정을 불러오지 못했습니다.");
  }

  return buildCalendarProjection(
    data.map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      category: row.category,
      amount: row.amount,
      currency: row.currency,
      billingCycle: row.billing_cycle,
      paymentMethodMemo: row.payment_method_memo,
      nextBillingDate: row.next_billing_date,
      status: row.status,
    })),
    year,
    month,
    today,
  );
}
