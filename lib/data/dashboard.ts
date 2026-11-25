import "server-only";

import { cache } from "react";
import { readTimeout } from "@/lib/data/read-timeout";
import { requireSessionUser } from "@/lib/data/session-user";
import { findPendingConfirmations, type PendingConfirmationSubscriptionItem } from "@/lib/dashboard/pending";
import { summarizeDashboard, type HomeDashboardData } from "@/lib/dashboard/summary";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { todayInSeoul } from "@/lib/time/seoul";

/** 로그인 사용자의 활성 구독 (한 요청 안에서는 한 번만 조회) */
const loadActiveSubscriptions = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const user = await requireSessionUser(supabase);

  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, service_name, category, amount, currency, billing_cycle, billing_day, next_billing_date, payment_method_memo, status")
    .eq("user_id", user.id)
    .eq("status", "ACTIVE")
    .abortSignal(readTimeout());
  if (error) {
    console.error("[dashboard] query failed", { code: error.code });
    throw new Error("대시보드 정보를 불러오지 못했습니다.");
  }

  return data.map((row) => ({
    id: row.id,
    serviceName: row.service_name,
    category: row.category,
    amount: row.amount,
    currency: row.currency,
    billingCycle: row.billing_cycle,
    billingDay: row.billing_day,
    nextBillingDate: row.next_billing_date,
    paymentMethodMemo: row.payment_method_memo,
    status: row.status,
  }));
});

/** 로그인 사용자의 홈 대시보드 데이터 (서울 기준 이번 달) */
export async function getHomeDashboardSummary(referenceDate: Date = new Date()): Promise<HomeDashboardData> {
  return summarizeDashboard(await loadActiveSubscriptions(), todayInSeoul(referenceDate));
}

/** 결제 예정일이 지나 사용자 확인이 필요한 활성 구독 */
export async function getPendingConfirmationSubscriptions(referenceDate: Date = new Date()): Promise<PendingConfirmationSubscriptionItem[]> {
  return findPendingConfirmations(await loadActiveSubscriptions(), todayInSeoul(referenceDate));
}
