import { describe, expect, it } from "vitest";
import { calculateNextBillingDate } from "@/lib/billing/cycle";
import { findPendingConfirmations } from "@/lib/dashboard/pending";
import type { DashboardSubscription } from "@/lib/dashboard/summary";

let seq = 0;
const sub = (overrides: Partial<DashboardSubscription & { billingDay: number | null }>) => ({
  id: `id-${(seq += 1)}`,
  serviceName: `서비스${seq}`,
  category: "OTT",
  amount: 10000,
  currency: "KRW" as const,
  billingCycle: "MONTHLY" as const,
  nextBillingDate: "2026-11-20",
  paymentMethodMemo: null,
  status: "ACTIVE" as const,
  billingDay: 20,
  ...overrides,
});

describe("findPendingConfirmations", () => {
  it("lists only active subscriptions whose date is before today, oldest first, with overdue days", () => {
    const result = findPendingConfirmations(
      [
        sub({ serviceName: "오늘", nextBillingDate: "2026-11-25" }),
        sub({ serviceName: "어제", nextBillingDate: "2026-11-24" }),
        sub({ serviceName: "열흘 전", nextBillingDate: "2026-11-15", paymentMethodMemo: "현대카드" }),
        sub({ serviceName: "중지", nextBillingDate: "2026-11-01", status: "PAUSED" }),
        sub({ serviceName: "종료", nextBillingDate: "2026-11-01", status: "TERMINATED" }),
        sub({ serviceName: "미래", nextBillingDate: "2026-12-01" }),
      ],
      "2026-11-25",
    );
    expect(result.map((item) => [item.serviceName, item.overdueDays, item.paymentMethodMemo])).toEqual([
      ["열흘 전", 10, "현대카드"],
      ["어제", 1, null],
    ]);
  });
});

describe("next date after confirming a late payment", () => {
  it("rolls from the original date, not the day it was confirmed", () => {
    // 1월 31일 결제를 2월 5일에 확인해도 다음은 2월 말일
    expect(calculateNextBillingDate({ currentDate: "2026-01-31", billingCycle: "MONTHLY", billingDay: 31 })).toBe("2026-02-28");
    expect(calculateNextBillingDate({ currentDate: "2028-01-31", billingCycle: "MONTHLY", billingDay: 31 })).toBe("2028-02-29");
    expect(calculateNextBillingDate({ currentDate: "2024-02-29", billingCycle: "YEARLY", billingDay: 29 })).toBe("2025-02-28");
  });
});
