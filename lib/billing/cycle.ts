import type { AdvanceBillingCycleInput, NextBillingDateInput } from "@/types/billing";
import { BillingCalculationError } from "./errors";

/*
 * 결제 주기 연산. Date 객체를 쓰지 않고 "YYYY-MM-DD" 문자열을 정수로 나눠 계산해
 * 시간대(UTC↔Asia/Seoul) 변환으로 하루가 밀리는 문제를 원천 차단한다.
 * 원 청구 기준일(billing_day)은 보존하고, 대상 월에 그 날이 없으면 말일로 보정한 뒤 다음 주기에 복원한다.
 */

const MAX_ROLLOVERS = 120;

export interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** 유효한 "YYYY-MM-DD"면 연·월·일, 아니면 null (예외 없이 검사할 때 사용) */
export function parseCalendarDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || day < 1 || day > getDaysInMonth(year, month)) return null;
  return { year, month, day };
}

function requireCalendarDate(value: string, field: string): CalendarDate {
  const parsed = parseCalendarDate(value);
  if (!parsed) {
    throw new BillingCalculationError(`${field}는 존재하는 YYYY-MM-DD 날짜여야 합니다: ${JSON.stringify(value)}`, "INVALID_DATE_FORMAT");
  }
  return parsed;
}

function requireBillingDay(billingDay: number): void {
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
    throw new BillingCalculationError(`billingDay는 1~31 사이 정수여야 합니다: ${billingDay}`, "INVALID_BILLING_DAY");
  }
}

const pad = (value: number, length: number) => String(value).padStart(length, "0");
const formatCalendarDate = ({ year, month, day }: CalendarDate) => `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;

/** 등록 시 결제 예정일에서 원 청구 기준일(1~31)을 꺼낸다 */
export function resolveBillingDay(dateString: string): number {
  return requireCalendarDate(dateString, "dateString").day;
}

/** 한 주기 뒤 결제일: 월간은 다음 달, 연간은 다음 해 같은 달. 그 달에 기준일이 없으면 말일. */
export function calculateNextBillingDate({ currentDate, billingCycle, billingDay }: NextBillingDateInput): string {
  const current = requireCalendarDate(currentDate, "currentDate");
  requireBillingDay(billingDay);

  let year = current.year;
  let month = current.month;
  if (billingCycle === "MONTHLY") {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  } else {
    year += 1;
  }

  return formatCalendarDate({ year, month, day: Math.min(billingDay, getDaysInMonth(year, month)) });
}

/**
 * targetDate가 있으면 결과가 targetDate보다 뒤(미래)가 될 때까지 주기를 반복 진행한다 (확인이 늦어도 원래 주기 유지).
 * targetDate가 없으면 정확히 1주기. 최대 120회를 넘으면 CALCULATION_OVERFLOW.
 */
export function advanceBillingCycle({ targetDate, ...input }: AdvanceBillingCycleInput): string {
  if (targetDate === undefined) return calculateNextBillingDate(input);
  requireCalendarDate(targetDate, "targetDate");

  let next = calculateNextBillingDate(input);
  for (let count = 1; next <= targetDate; count += 1) {
    if (count >= MAX_ROLLOVERS) {
      throw new BillingCalculationError(`${MAX_ROLLOVERS}주기를 넘게 진행해야 해 계산을 중단했습니다.`, "CALCULATION_OVERFLOW");
    }
    next = calculateNextBillingDate({ ...input, currentDate: next });
  }
  return next;
}
