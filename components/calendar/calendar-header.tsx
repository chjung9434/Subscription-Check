import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { shiftMonth } from "@/lib/calendar/calendar-utils";
import { buttonStyles } from "@/components/ui/styles";

const monthHref = (year: number, month: number, selectedDate?: string) =>
  `/subscriptions?view=calendar&year=${year}&month=${month}${selectedDate ? `&selectedDate=${selectedDate}` : ""}`;

export function CalendarHeader({ year, month, today }: { year: number; month: number; today: string }) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const isCurrent = today.startsWith(`${year}-${String(month).padStart(2, "0")}`);
  const navButton = "flex size-11 items-center justify-center rounded-xl text-foreground outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-primary";
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center">
        {prev.year >= 2000 ? (
          <Link href={monthHref(prev.year, prev.month)} aria-label={`이전 달 (${prev.year}년 ${prev.month}월)`} className={navButton}>
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Link>
        ) : null}
        <h2 className="min-w-28 text-center text-section text-foreground" aria-live="polite">
          {year}년 {month}월
        </h2>
        {next.year <= 2100 ? (
          <Link href={monthHref(next.year, next.month)} aria-label={`다음 달 (${next.year}년 ${next.month}월)`} className={navButton}>
            <ChevronRight aria-hidden="true" className="size-5" />
          </Link>
        ) : null}
      </div>
      {isCurrent ? null : (
        <Link href={monthHref(Number(today.slice(0, 4)), Number(today.slice(5, 7)), today)} className={buttonStyles.secondary}>
          오늘
        </Link>
      )}
    </div>
  );
}
