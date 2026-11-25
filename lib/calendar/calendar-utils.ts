import { getDaysInMonth } from "@/lib/billing/cycle";
import { formatSpendingDisplay } from "@/lib/dashboard/summary";
import { addDays } from "@/lib/time/seoul";
import type { BillingCycleType, CurrencyCode } from "@/types/database";

export interface CalendarBillingItem {
  id: string;
  serviceName: string;
  category: string;
  amount: number;
  currency: CurrencyCode;
  billingCycle: BillingCycleType;
  paymentMethodMemo: string | null;
  nextBillingDate: string;
  isOverdue: boolean;
}

export interface CalendarDaySummary {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasOverdue: boolean;
  totalKrw: number;
  totalUsd: number;
  items: CalendarBillingItem[];
}

export interface MonthlyCalendarProjection {
  year: number;
  month: number;
  today: string;
  days: CalendarDaySummary[];
  monthlyTotalKrw: number;
  monthlyTotalUsd: number;
}

const pad = (value: number) => String(value).padStart(2, "0");
export const monthStart = (year: number, month: number) => `${year}-${pad(month)}-01`;
export const monthEnd = (year: number, month: number) => `${year}-${pad(month)}-${pad(getDaysInMonth(year, month))}`;

/** 일요일 시작 7열 달력 날짜 (앞뒤 달 채움 포함, 최소 5주 = 35일, 필요하면 42일) */
export function buildMonthGrid(year: number, month: number): { date: string; dayNumber: number; isCurrentMonth: boolean }[] {
  const first = monthStart(year, month);
  const leading = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = getDaysInMonth(year, month);
  const weeks = Math.max(5, Math.ceil((leading + daysInMonth) / 7));
  const start = addDays(first, -leading);
  return Array.from({ length: weeks * 7 }, (_, index) => {
    const date = addDays(start, index);
    return { date, dayNumber: Number(date.slice(8)), isCurrentMonth: date.slice(0, 7) === first.slice(0, 7) };
  });
}

export interface CalendarSourceItem extends Omit<CalendarBillingItem, "isOverdue"> {
  status: "ACTIVE" | "PAUSED" | "TERMINATED";
}

/** 활성 구독만 날짜별로 묶고 통화별 소계·기한 경과 여부를 계산한다 (환산 없음, 센트 정수 합산) */
export function buildCalendarProjection(items: readonly CalendarSourceItem[], year: number, month: number, today: string): MonthlyCalendarProjection {
  const start = monthStart(year, month);
  const end = monthEnd(year, month);
  const byDate = new Map<string, CalendarBillingItem[]>();
  for (const item of items) {
    if (item.status !== "ACTIVE" || item.nextBillingDate < start || item.nextBillingDate > end) continue;
    const list = byDate.get(item.nextBillingDate) ?? [];
    list.push({
      id: item.id,
      serviceName: item.serviceName,
      category: item.category,
      amount: item.amount,
      currency: item.currency,
      billingCycle: item.billingCycle,
      paymentMethodMemo: item.paymentMethodMemo,
      nextBillingDate: item.nextBillingDate,
      isOverdue: item.nextBillingDate < today,
    });
    byDate.set(item.nextBillingDate, list);
  }

  let monthKrw = 0;
  let monthUsd = 0;
  const days = buildMonthGrid(year, month).map((cell) => {
    const dayItems = (byDate.get(cell.date) ?? []).sort((a, b) => a.serviceName.localeCompare(b.serviceName, "ko"));
    let krw = 0;
    let usd = 0;
    for (const item of dayItems) {
      const cents = Math.round(item.amount * 100);
      if (item.currency === "KRW") krw += cents;
      else usd += cents;
    }
    monthKrw += krw;
    monthUsd += usd;
    return {
      ...cell,
      isToday: cell.date === today,
      hasOverdue: dayItems.some((item) => item.isOverdue),
      totalKrw: krw / 100,
      totalUsd: usd / 100,
      items: dayItems,
    };
  });

  return { year, month, today, days, monthlyTotalKrw: monthKrw / 100, monthlyTotalUsd: monthUsd / 100 };
}

/** 이동 가능한 연·월 (2000~2100) */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export const formatDayTotals = (day: Pick<CalendarDaySummary, "totalKrw" | "totalUsd">) => formatSpendingDisplay(day.totalKrw, day.totalUsd);
