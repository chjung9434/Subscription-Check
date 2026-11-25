import "server-only";

import { readTimeout } from "@/lib/data/read-timeout";
import { summarizeDashboard, type HomeDashboardData } from "@/lib/dashboard/summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayInSeoul } from "@/lib/time/seoul";

/** 로그인 사용자의 홈 대시보드 데이터 (서울 기준 이번 달) */
export async function getHomeDashboardSummary(referenceDate: Date = new Date()): Promise<HomeDashboardData> {
  const supabase = await createSupabaseServerClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    throw new Error("로그인이 필요합니다.");
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, service_name, category, amount, currency, billing_cycle, next_billing_date, payment_method_memo, status")
    .eq("user_id", auth.user.id)
    .eq("status", "ACTIVE")
    .abortSignal(readTimeout());
  if (error) {
    console.error("[dashboard] query failed", { code: error.code });
    throw new Error("대시보드 정보를 불러오지 못했습니다.");
  }

  return summarizeDashboard(
    data.map((row) => ({
      id: row.id,
      serviceName: row.service_name,
      category: row.category,
      amount: row.amount,
      currency: row.currency,
      billingCycle: row.billing_cycle,
      nextBillingDate: row.next_billing_date,
      paymentMethodMemo: row.payment_method_memo,
      status: row.status,
    })),
    todayInSeoul(referenceDate),
  );
}
