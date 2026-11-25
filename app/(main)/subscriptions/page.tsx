import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarSkeleton, ListSkeleton } from "@/components/calendar/calendar-skeleton";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ViewModeToggle } from "@/components/calendar/view-mode-toggle";
import { SavedNotice } from "@/components/subscriptions/saved-notice";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { PageHeading } from "@/components/ui/page-heading";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { getCalendarMonthlySchedules } from "@/lib/calendar/get-calendar-data";
import { parseSubscriptionsQuery } from "@/lib/calendar/query";
import { getSubscriptionsList } from "@/lib/data/subscriptions";
import { todayInSeoul } from "@/lib/time/seoul";

async function ListContent() {
  const items = await getSubscriptionsList();
  if (items.length === 0) {
    return (
      <section className={`${cardStyles} flex flex-col items-center gap-4 py-10 text-center`}>
        <div>
          <h2 className="text-section text-foreground">등록된 구독 서비스가 없어요</h2>
          <p className="mt-1 text-body text-muted-foreground">자주 쓰는 서비스를 등록하고 결제일을 관리해 보세요!</p>
        </div>
        <Link href="/subscriptions/new" className={buttonStyles.primary}>
          <Plus aria-hidden="true" className="size-5" />첫 구독 등록하기
        </Link>
      </section>
    );
  }
  return (
    <ul className="flex flex-col gap-3" aria-label="구독 목록 (다음 결제일 순)">
      {items.map((item) => (
        <li key={item.id}>
          <SubscriptionCard item={item} />
        </li>
      ))}
    </ul>
  );
}

async function CalendarContent({ year, month, today, selectedDate }: { year: number; month: number; today: string; selectedDate: string }) {
  const projection = await getCalendarMonthlySchedules({ year, month }, today);
  return <CalendarView key={`${year}-${month}`} projection={projection} initialSelectedDate={selectedDate} />;
}

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const today = todayInSeoul();
  const { view, year, month, selectedDate } = parseSubscriptionsQuery(params, today);

  return (
    <>
      <PageHeading
        title="구독 관리"
        action={
          <Link href="/subscriptions/new" className={buttonStyles.primary}>
            <Plus aria-hidden="true" className="size-5" />
            구독 추가
          </Link>
        }
      />
      <SavedNotice saved={params.saved} notify={params.notify} />
      <ViewModeToggle view={view} year={year} month={month} />
      {view === "calendar" ? (
        <>
          <CalendarHeader year={year} month={month} today={today} />
          <Suspense key={`calendar-${year}-${month}`} fallback={<CalendarSkeleton />}>
            <CalendarContent year={year} month={month} today={today} selectedDate={selectedDate} />
          </Suspense>
        </>
      ) : (
        <Suspense key="list" fallback={<ListSkeleton />}>
          <ListContent />
        </Suspense>
      )}
    </>
  );
}
