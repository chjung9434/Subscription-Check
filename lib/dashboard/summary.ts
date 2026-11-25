import { formatAmount } from "@/lib/format";
import { daysBetween, monthRangeOf } from "@/lib/time/seoul";
import type { BillingCycleType, CurrencyCode, SubscriptionStatus } from "@/types/database";

export interface DashboardSubscription {
  id: string;
  serviceName: string;
  category: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycleType;
  nextBillingDate: string;
  paymentMethodMemo: string | null;
  status: SubscriptionStatus;
}

export interface DashboardSpendingSummary {
  totalKrw: number;
  totalUsd: number;
  /** "₩35,000 / $12.99" | "₩35,000" | "$12.99" | "₩0" */
  formattedDisplay: string;
}

export interface UpcomingSubscriptionItem extends Omit<DashboardSubscription, "status"> {
  /** 0: 오늘, 1: D-1 ... */
  dDay: number;
}

export interface HomeDashboardData {
  activeSubscriptionCount: number;
  spending: DashboardSpendingSummary;
  upcomingList: UpcomingSubscriptionItem[];
  currentMonthNumber: number;
}

export const UPCOMING_LIMIT = 5;

export function formatSpendingDisplay(totalKrw: number, totalUsd: number): string {
  const parts = [totalKrw > 0 ? formatAmount(totalKrw, "KRW") : null, totalUsd > 0 ? formatAmount(totalUsd, "USD") : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : formatAmount(0, "KRW");
}

/**
 * 홈 대시보드 집계 (today: 서울 기준 "YYYY-MM-DD").
 * - 활성 구독만 대상. 이번 달에 결제 예정일이 있는 것만 통화별로 따로 합산 (연간 구독도 그 달에만 전액, 1/12 분할 없음, 환산 없음)
 * - 다가오는 결제: 오늘 이후(오늘 포함) 결제일 오름차순 최대 5건
 */
export function summarizeDashboard(subscriptions: readonly DashboardSubscription[], today: string): HomeDashboardData {
  const { start, end, month } = monthRangeOf(today);
  const active = subscriptions.filter((item) => item.status === "ACTIVE");

  // 부동소수 오차를 피하려고 센트(전) 단위 정수로 더한다
  let krwCents = 0;
  let usdCents = 0;
  for (const item of active) {
    if (item.nextBillingDate < start || item.nextBillingDate > end) continue;
    const cents = Math.round(item.amount * 100);
    if (item.currency === "KRW") krwCents += cents;
    else usdCents += cents;
  }
  const totalKrw = krwCents / 100;
  const totalUsd = usdCents / 100;

  const upcomingList = active
    .filter((item) => item.nextBillingDate >= today)
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate) || a.serviceName.localeCompare(b.serviceName, "ko"))
    .slice(0, UPCOMING_LIMIT)
    .map((item) => ({
      id: item.id,
      serviceName: item.serviceName,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      billingCycle: item.billingCycle,
      nextBillingDate: item.nextBillingDate,
      paymentMethodMemo: item.paymentMethodMemo,
      dDay: daysBetween(today, item.nextBillingDate),
    }));

  return {
    activeSubscriptionCount: active.length,
    spending: { totalKrw, totalUsd, formattedDisplay: formatSpendingDisplay(totalKrw, totalUsd) },
    upcomingList,
    currentMonthNumber: month,
  };
}
