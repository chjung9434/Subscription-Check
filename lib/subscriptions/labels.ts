import type { BillingCycleType, CurrencyCode, SubscriptionStatus } from "@/types/database";

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  ACTIVE: "활성",
  PAUSED: "일시 중지",
  TERMINATED: "종료",
};

export const CYCLE_LABELS: Record<BillingCycleType, string> = {
  MONTHLY: "월간",
  YEARLY: "연간",
};

export const CYCLE_SUFFIX: Record<BillingCycleType, string> = {
  MONTHLY: "/월",
  YEARLY: "/년",
};

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  KRW: "원화 (₩)",
  USD: "달러 ($)",
};

/** 등록 폼 카테고리 선택지 (프리셋 카테고리 포함) */
export const CATEGORY_OPTIONS = ["OTT", "AI", "음악", "클라우드", "생산성", "도서", "교육", "생활", "기타"] as const;
