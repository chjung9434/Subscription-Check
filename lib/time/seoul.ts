import { getDaysInMonth, parseCalendarDate } from "@/lib/billing/cycle";
import { APP_TIME_ZONE } from "@/lib/time-zone";

const SEOUL_DATE = new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** 서울 기준 오늘 "YYYY-MM-DD" (서버 시간대가 UTC여도 정확) */
export function todayInSeoul(now: Date = new Date()): string {
  return SEOUL_DATE.format(now);
}

/** 날짜가 속한 달의 첫날·말일 "YYYY-MM-DD" */
export function monthRangeOf(date: string): { start: string; end: string; year: number; month: number } {
  const parsed = parseCalendarDate(date);
  if (!parsed) throw new Error(`invalid calendar date: ${date}`);
  const prefix = date.slice(0, 8);
  return { start: `${prefix}01`, end: `${prefix}${String(getDaysInMonth(parsed.year, parsed.month)).padStart(2, "0")}`, year: parsed.year, month: parsed.month };
}

/** 두 역법 날짜 사이 일수 (to - from). 시각이 없으므로 UTC 정수 연산으로 시간대 영향이 없다. */
export function daysBetween(from: string, to: string): number {
  const a = parseCalendarDate(from);
  const b = parseCalendarDate(to);
  if (!a || !b) throw new Error(`invalid calendar date: ${from} / ${to}`);
  const MS_PER_DAY = 86_400_000;
  return (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / MS_PER_DAY;
}

/** 역법 날짜에 일수를 더한다 (음수면 뺀다) */
export function addDays(date: string, days: number): string {
  const parsed = parseCalendarDate(date);
  if (!parsed) throw new Error(`invalid calendar date: ${date}`);
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + days)).toISOString().slice(0, 10);
}

/** 서울 시각(날짜 + "HH:mm[:ss]")을 UTC ISO 문자열로. 한국은 서머타임이 없어 항상 UTC+9. */
export function seoulDateTimeToIso(date: string, time: string): string {
  const parsed = parseCalendarDate(date);
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!parsed || !match) throw new Error(`invalid date/time: ${date} ${time}`);
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, Number(match[1]) - 9, Number(match[2]), Number(match[3] ?? 0))).toISOString();
}
