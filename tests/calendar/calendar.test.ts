import { describe, expect, it } from "vitest";
import { buildCalendarProjection, buildMonthGrid, shiftMonth, type CalendarSourceItem } from "@/lib/calendar/calendar-utils";
import { parseSubscriptionsQuery } from "@/lib/calendar/query";

describe("buildMonthGrid", () => {
  it.each([
    [2026, 2, 35, "2026-02-01"], // 일요일 시작, 28일 → 4주지만 최소 5주
    [2025, 2, 35, "2025-01-26"], // 토요일 시작 평년 2월
    [2024, 2, 35, "2024-01-28"], // 윤년 2월 (목요일 시작)
    [2026, 8, 42, "2026-07-26"], // 토요일 시작 31일 → 6주
    [2026, 11, 35, "2026-11-01"], // 30일
  ])("%i-%i has %i cells starting %s", (year, month, cells, firstCell) => {
    const grid = buildMonthGrid(year, month);
    expect(grid).toHaveLength(cells);
    expect(grid[0].date).toBe(firstCell);
    expect(grid.filter((day) => day.isCurrentMonth)).toHaveLength(new Date(Date.UTC(year, month, 0)).getUTCDate());
  });

  it("flags padding days from other months", () => {
    const grid = buildMonthGrid(2025, 2);
    expect(grid[0]).toEqual({ date: "2025-01-26", dayNumber: 26, isCurrentMonth: false });
    expect(grid[6]).toEqual({ date: "2025-02-01", dayNumber: 1, isCurrentMonth: true });
    expect(grid.at(-1)).toEqual({ date: "2025-03-01", dayNumber: 1, isCurrentMonth: false });
  });
});

describe("buildCalendarProjection", () => {
  let seq = 0;
  const item = (overrides: Partial<CalendarSourceItem>): CalendarSourceItem => ({
    id: `id-${(seq += 1)}`,
    serviceName: `서비스${seq}`,
    category: "OTT",
    amount: 10000,
    currency: "KRW",
    billingCycle: "MONTHLY",
    paymentMethodMemo: null,
    nextBillingDate: "2026-11-25",
    status: "ACTIVE",
    ...overrides,
  });

  const projection = buildCalendarProjection(
    [
      item({ amount: 17000, nextBillingDate: "2026-11-25", paymentMethodMemo: "현대 제로카드" }),
      item({ amount: 12.99, currency: "USD", nextBillingDate: "2026-11-25" }),
      item({ amount: 5000, nextBillingDate: "2026-11-10" }),
      item({ amount: 7000, nextBillingDate: "2026-11-25", status: "PAUSED" }),
      item({ amount: 9000, nextBillingDate: "2026-11-26", status: "TERMINATED" }),
      item({ amount: 1, nextBillingDate: "2026-12-01" }),
    ],
    2026,
    11,
    "2026-11-20",
  );
  const day = (date: string) => projection.days.find((cell) => cell.date === date);

  it("groups active items by day with separate KRW/USD totals", () => {
    expect(day("2026-11-25")).toMatchObject({ totalKrw: 17000, totalUsd: 12.99, hasOverdue: false });
    expect(day("2026-11-25")?.items).toHaveLength(2);
  });

  it("excludes paused and terminated subscriptions", () => {
    expect(day("2026-11-26")?.items).toEqual([]);
    expect(projection.days.flatMap((cell) => cell.items).map((entry) => entry.amount)).not.toContain(7000);
  });

  it("marks items before today as overdue", () => {
    expect(day("2026-11-10")).toMatchObject({ hasOverdue: true });
    expect(day("2026-11-10")?.items[0].isOverdue).toBe(true);
  });

  it("ignores items outside the month and marks today", () => {
    expect(day("2026-12-01")?.items ?? []).toEqual([]);
    expect(projection.days.filter((cell) => cell.isToday).map((cell) => cell.date)).toEqual(["2026-11-20"]);
    expect([projection.monthlyTotalKrw, projection.monthlyTotalUsd]).toEqual([22000, 12.99]);
  });
});

describe("query parsing", () => {
  const today = "2026-11-25";

  it("defaults to the list view and today's month", () => {
    expect(parseSubscriptionsQuery({}, today)).toEqual({ view: "list", year: 2026, month: 11, selectedDate: "2026-11-25" });
  });

  it("selects the 1st when another month is shown", () => {
    expect(parseSubscriptionsQuery({ view: "calendar", year: "2027", month: "2" }, today)).toEqual({
      view: "calendar",
      year: 2027,
      month: 2,
      selectedDate: "2027-02-01",
    });
  });

  it("keeps a valid selected date in that month and rejects others", () => {
    expect(parseSubscriptionsQuery({ view: "calendar", year: "2026", month: "12", selectedDate: "2026-12-15" }, today).selectedDate).toBe("2026-12-15");
    expect(parseSubscriptionsQuery({ view: "calendar", year: "2026", month: "12", selectedDate: "2026-11-15" }, today).selectedDate).toBe("2026-12-01");
    expect(parseSubscriptionsQuery({ view: "calendar", year: "2026", month: "2", selectedDate: "2026-02-30" }, today).selectedDate).toBe("2026-02-01");
  });

  it("falls back for out-of-range or malformed months", () => {
    expect(parseSubscriptionsQuery({ view: "calendar", year: "1999", month: "5" }, today)).toMatchObject({ year: 2026, month: 11 });
    expect(parseSubscriptionsQuery({ view: "calendar", year: "2026", month: "13" }, today)).toMatchObject({ year: 2026, month: 11 });
    expect(parseSubscriptionsQuery({ view: "other" }, today).view).toBe("list");
  });

  it("moves across year boundaries", () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});
