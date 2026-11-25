import { z } from "zod";
import { parseCalendarDate } from "@/lib/billing/cycle";

export const CalendarQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type SubscriptionsView = "list" | "calendar";

export interface SubscriptionsPageQuery {
  view: SubscriptionsView;
  year: number;
  month: number;
  selectedDate: string;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/** URL 쿼리를 검증해 화면 상태로. 잘못된 값은 오늘(서울) 기준 기본값으로 대체. */
export function parseSubscriptionsQuery(params: Record<string, string | string[] | undefined>, today: string): SubscriptionsPageQuery {
  const view: SubscriptionsView = first(params.view) === "calendar" ? "calendar" : "list";
  const parsed = CalendarQuerySchema.safeParse({ year: first(params.year), month: first(params.month) });
  const year = parsed.success ? parsed.data.year : Number(today.slice(0, 4));
  const month = parsed.success ? parsed.data.month : Number(today.slice(5, 7));

  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const requested = first(params.selectedDate);
  const selectedDate =
    requested && parseCalendarDate(requested) && requested.startsWith(prefix) ? requested : today.startsWith(prefix) ? today : `${prefix}-01`;
  return { view, year, month, selectedDate };
}
