import { daysBetween } from "@/lib/time/seoul";
import type { DashboardSubscription } from "./summary";

export interface PendingConfirmationSubscriptionItem {
  id: string;
  serviceName: string;
  category: string;
  amount: number;
  currency: DashboardSubscription["currency"];
  billingCycle: DashboardSubscription["billingCycle"];
  /** 원래(지난) 결제 예정일 YYYY-MM-DD */
  nextBillingDate: string;
  billingDay: number | null;
  paymentMethodMemo: string | null;
  /** 결제 예정일로부터 지난 일수 (1 이상) */
  overdueDays: number;
}

/** 결제 예정일이 오늘(서울)보다 이전인 활성 구독. 오래 지난 순. */
export function findPendingConfirmations(
  subscriptions: readonly (DashboardSubscription & { billingDay: number | null })[],
  today: string,
): PendingConfirmationSubscriptionItem[] {
  return subscriptions
    .filter((item) => item.status === "ACTIVE" && item.nextBillingDate < today)
    .sort((a, b) => a.nextBillingDate.localeCompare(b.nextBillingDate) || a.serviceName.localeCompare(b.serviceName, "ko"))
    .map((item) => ({
      id: item.id,
      serviceName: item.serviceName,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      billingCycle: item.billingCycle,
      nextBillingDate: item.nextBillingDate,
      billingDay: item.billingDay,
      paymentMethodMemo: item.paymentMethodMemo,
      overdueDays: daysBetween(item.nextBillingDate, today),
    }));
}
