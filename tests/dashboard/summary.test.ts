import { describe, expect, it } from "vitest";
import { formatSpendingDisplay, summarizeDashboard, type DashboardSubscription } from "@/lib/dashboard/summary";
import { daysBetween, monthRangeOf, todayInSeoul } from "@/lib/time/seoul";

let seq = 0;
const sub = (overrides: Partial<DashboardSubscription>): DashboardSubscription => ({
  id: `id-${(seq += 1)}`,
  serviceName: `서비스${seq}`,
  category: "OTT",
  amount: 10000,
  currency: "KRW",
  billingCycle: "MONTHLY",
  nextBillingDate: "2026-11-28",
  paymentMethodMemo: null,
  status: "ACTIVE",
  ...overrides,
});

const TODAY = "2026-11-25";

describe("Seoul date helpers", () => {
  it("uses the Seoul calendar day even when UTC is still on the previous day", () => {
    // 2026-11-30T15:30Z = 서울 12월 1일 00:30
    expect(todayInSeoul(new Date("2026-11-30T15:30:00Z"))).toBe("2026-12-01");
    expect(todayInSeoul(new Date("2026-11-30T14:59:59Z"))).toBe("2026-11-30");
  });

  it("finds the month range including leap February", () => {
    expect(monthRangeOf("2024-02-10")).toMatchObject({ start: "2024-02-01", end: "2024-02-29", month: 2 });
    expect(monthRangeOf("2026-11-25")).toMatchObject({ start: "2026-11-01", end: "2026-11-30", month: 11 });
  });

  it("counts calendar days between dates", () => {
    expect(daysBetween("2026-11-25", "2026-11-25")).toBe(0);
    expect(daysBetween("2026-11-25", "2026-12-02")).toBe(7);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
  });
});

describe("summarizeDashboard spending", () => {
  it("adds KRW and USD separately without conversion", () => {
    const result = summarizeDashboard(
      [
        sub({ amount: 17000, nextBillingDate: "2026-11-05" }),
        sub({ amount: 9900, nextBillingDate: "2026-11-26" }),
        sub({ amount: 8100, nextBillingDate: "2026-11-30" }),
        sub({ amount: 12.99, currency: "USD", nextBillingDate: "2026-11-15" }),
      ],
      TODAY,
    ).spending;
    expect(result).toEqual({ totalKrw: 35000, totalUsd: 12.99, formattedDisplay: "₩35,000 / $12.99" });
  });

  it("counts a yearly plan in full only in its billing month", () => {
    expect(summarizeDashboard([sub({ amount: 120000, billingCycle: "YEARLY", nextBillingDate: "2026-11-30" })], TODAY).spending.totalKrw).toBe(120000);
    expect(summarizeDashboard([sub({ amount: 120000, billingCycle: "YEARLY", nextBillingDate: "2026-12-01" })], TODAY).spending.totalKrw).toBe(0);
  });

  it("excludes paused and terminated subscriptions from totals and the active count", () => {
    const result = summarizeDashboard(
      [sub({ amount: 5000 }), sub({ amount: 7000, status: "PAUSED" }), sub({ amount: 9000, status: "TERMINATED" })],
      TODAY,
    );
    expect(result.spending.totalKrw).toBe(5000);
    expect(result.activeSubscriptionCount).toBe(1);
    expect(result.upcomingList).toHaveLength(1);
  });

  it("excludes dates outside the current month", () => {
    const result = summarizeDashboard([sub({ nextBillingDate: "2026-10-31" }), sub({ nextBillingDate: "2026-12-01" })], TODAY);
    expect(result.spending.totalKrw).toBe(0);
    expect(result.currentMonthNumber).toBe(11);
  });

  it("adds USD cents without floating point drift", () => {
    const items = [0.1, 0.2, 19.99].map((amount) => sub({ amount, currency: "USD" }));
    expect(summarizeDashboard(items, TODAY).spending.totalUsd).toBe(20.29);
  });
});

describe("formatSpendingDisplay", () => {
  it.each([
    [35000, 12.99, "₩35,000 / $12.99"],
    [35000, 0, "₩35,000"],
    [0, 12.99, "$12.99"],
    [0, 0, "₩0"],
  ])("%d KRW + %d USD -> %s", (krw, usd, expected) => {
    expect(formatSpendingDisplay(krw, usd)).toBe(expected);
  });
});

describe("upcoming list", () => {
  it("shows up to five active items from today onward, earliest first, with D-Day", () => {
    const items = [
      sub({ serviceName: "지난 결제", nextBillingDate: "2026-11-20" }),
      sub({ serviceName: "F", nextBillingDate: "2027-01-10" }),
      sub({ serviceName: "E", nextBillingDate: "2026-12-20" }),
      sub({ serviceName: "오늘", nextBillingDate: "2026-11-25" }),
      sub({ serviceName: "B", nextBillingDate: "2026-11-26" }),
      sub({ serviceName: "D", nextBillingDate: "2026-12-05" }),
      sub({ serviceName: "C", nextBillingDate: "2026-11-28" }),
    ];
    const list = summarizeDashboard(items, TODAY).upcomingList;
    expect(list.map((item) => [item.serviceName, item.dDay])).toEqual([
      ["오늘", 0],
      ["B", 1],
      ["C", 3],
      ["D", 10],
      ["E", 25],
    ]);
  });
});
