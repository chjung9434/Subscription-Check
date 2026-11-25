import { formatAmount, formatDate } from "@/lib/format";
import type { CurrencyCode } from "@/types/database";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
  timestamp: number;
}

/** 결제 사전 알림 내용 (통화는 원래 통화 그대로) */
export function buildReminderPayload(input: {
  subscriptionId: string;
  serviceName: string;
  amount: number;
  currency: CurrencyCode;
  paymentMethodMemo: string | null;
  targetDate: string;
  daysBefore: number;
  now: Date;
}): PushPayload {
  const amount = formatAmount(input.amount, input.currency);
  const method = input.paymentMethodMemo ? ` ${input.paymentMethodMemo}로` : "";
  return {
    title: `[결제 D-${input.daysBefore}] ${input.serviceName} 결제 예정`,
    body: `${formatDate(input.targetDate)}에 ${amount}이${method} 결제될 예정입니다.`,
    url: `/subscriptions/${input.subscriptionId}`,
    tag: `sub-${input.subscriptionId}-${input.targetDate}`,
    timestamp: input.now.getTime(),
  };
}

export function buildTestPayload(now: Date): PushPayload {
  return {
    title: "[구독체크] 결제 사전 알림 테스트",
    body: "테스트 구독의 ₩9,900 결제가 3일 후 예정되어 있습니다.",
    url: "/notifications",
    tag: "test-push",
    timestamp: now.getTime(),
  };
}
