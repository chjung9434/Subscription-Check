import { describe, expect, it } from "vitest";
import { advanceBillingCycle, calculateNextBillingDate, getDaysInMonth, isLeapYear, parseCalendarDate, resolveBillingDay } from "@/lib/billing/cycle";
import { BillingCalculationError } from "@/lib/billing/errors";
import type { BillingCycle } from "@/types/billing";

const next = (currentDate: string, billingDay: number, billingCycle: BillingCycle = "MONTHLY") =>
  calculateNextBillingDate({ currentDate, billingCycle, billingDay });

/** start부터 n번 연속 갱신한 날짜들 */
const chain = (start: string, billingDay: number, n: number, billingCycle: BillingCycle = "MONTHLY") => {
  const dates: string[] = [];
  let current = start;
  for (let i = 0; i < n; i += 1) {
    current = next(current, billingDay, billingCycle);
    dates.push(current);
  }
  return dates;
};

const expectBillingError = (fn: () => unknown, code: string) => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(BillingCalculationError);
    expect((error as BillingCalculationError).code).toBe(code);
    return;
  }
  throw new Error("expected BillingCalculationError");
};

describe("calendar helpers", () => {
  it.each([
    [2024, true],
    [2025, false],
    [2000, true],
    [1900, false],
    [2100, false],
  ])("isLeapYear(%i) is %s", (year, leap) => {
    expect(isLeapYear(year)).toBe(leap);
  });

  it("knows the days in every month", () => {
    expect(Array.from({ length: 12 }, (_, i) => getDaysInMonth(2025, i + 1))).toEqual([31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]);
    expect(getDaysInMonth(2024, 2)).toBe(29);
  });

  it("parses only real calendar dates", () => {
    expect(parseCalendarDate("2024-02-29")).toEqual({ year: 2024, month: 2, day: 29 });
    expect(parseCalendarDate("2025-02-29")).toBeNull();
    expect(parseCalendarDate("2025-13-01")).toBeNull();
    expect(parseCalendarDate("2025-1-01")).toBeNull();
  });

  it("resolves the billing day from the first billing date", () => {
    expect(resolveBillingDay("2026-01-31")).toBe(31);
    expect(resolveBillingDay("2026-12-01")).toBe(1);
  });
});

describe("calculateNextBillingDate (MONTHLY)", () => {
  it("clamps to the end of February and restores the 31st in March", () => {
    expect(chain("2026-01-31", 31, 2)).toEqual(["2026-02-28", "2026-03-31"]);
    expect(next("2025-01-31", 31)).toBe("2025-02-28");
    expect(next("2025-02-28", 31)).toBe("2025-03-31");
  });

  it("uses the 29th of February in a leap year", () => {
    expect(next("2024-01-31", 31)).toBe("2024-02-29");
    expect(chain("2024-01-31", 31, 2)).toEqual(["2024-02-29", "2024-03-31"]);
  });

  it("goes back and forth between 30- and 31-day months", () => {
    expect(chain("2025-03-31", 31, 2)).toEqual(["2025-04-30", "2025-05-31"]);
    expect(chain("2025-05-31", 31, 7)).toEqual(["2025-06-30", "2025-07-31", "2025-08-31", "2025-09-30", "2025-10-31", "2025-11-30", "2025-12-31"]);
    expect(chain("2025-01-30", 30, 2)).toEqual(["2025-02-28", "2025-03-30"]);
  });

  it("rolls December over into January of the next year", () => {
    expect(next("2025-12-31", 31)).toBe("2026-01-31");
    expect(next("2025-12-15", 15)).toBe("2026-01-15");
  });

  it("keeps an ordinary day unchanged for a whole year", () => {
    expect(chain("2025-01-15", 15, 12).every((date) => date.endsWith("-15"))).toBe(true);
  });
});

describe("calculateNextBillingDate (YEARLY)", () => {
  it("clamps Feb 29 in common years and restores it in the next leap year", () => {
    expect(chain("2024-02-29", 29, 4, "YEARLY")).toEqual(["2025-02-28", "2026-02-28", "2027-02-28", "2028-02-29"]);
  });

  it("adds exactly one year otherwise", () => {
    expect(next("2026-11-30", 30, "YEARLY")).toBe("2027-11-30");
  });
});

describe("invalid input", () => {
  it.each([0, 32, -1, 1.5, Number.NaN])("rejects billingDay %s", (billingDay) => {
    expectBillingError(() => next("2025-01-15", billingDay), "INVALID_BILLING_DAY");
  });

  it.each(["2025/01/15", "2025-02-30", "2025-1-5", "", "2025-01-15T00:00:00Z"])("rejects date %j", (date) => {
    expectBillingError(() => next(date, 15), "INVALID_DATE_FORMAT");
    expectBillingError(() => resolveBillingDay(date), "INVALID_DATE_FORMAT");
  });
});

describe("advanceBillingCycle", () => {
  it("advances exactly one cycle without a target date", () => {
    expect(advanceBillingCycle({ currentDate: "2026-01-31", billingCycle: "MONTHLY", billingDay: 31 })).toBe("2026-02-28");
  });

  it("jumps past the target date while keeping the original billing day", () => {
    // 1월 31일 결제를 5월 10일에야 확인: 2/28, 3/31, 4/30 을 지나 5/31
    expect(advanceBillingCycle({ currentDate: "2026-01-31", billingCycle: "MONTHLY", billingDay: 31, targetDate: "2026-05-10" })).toBe("2026-05-31");
  });

  it("moves strictly after the target date when it lands on it", () => {
    expect(advanceBillingCycle({ currentDate: "2026-01-15", billingCycle: "MONTHLY", billingDay: 15, targetDate: "2026-02-15" })).toBe("2026-03-15");
  });

  it("returns the next cycle when the target is already before it", () => {
    expect(advanceBillingCycle({ currentDate: "2026-11-20", billingCycle: "MONTHLY", billingDay: 20, targetDate: "2026-11-25" })).toBe("2026-12-20");
  });

  it("handles yearly backlogs", () => {
    expect(advanceBillingCycle({ currentDate: "2020-02-29", billingCycle: "YEARLY", billingDay: 29, targetDate: "2026-11-25" })).toBe("2027-02-28");
  });

  it("stops after 120 cycles", () => {
    expectBillingError(
      () => advanceBillingCycle({ currentDate: "1900-01-01", billingCycle: "MONTHLY", billingDay: 1, targetDate: "2026-01-01" }),
      "CALCULATION_OVERFLOW",
    );
  });

  it("validates the target date", () => {
    expectBillingError(() => advanceBillingCycle({ currentDate: "2026-01-01", billingCycle: "MONTHLY", billingDay: 1, targetDate: "tomorrow" }), "INVALID_DATE_FORMAT");
  });
});
