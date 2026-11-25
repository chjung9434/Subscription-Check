import type { HomeDashboardData } from "@/lib/dashboard/summary";
import { cardStyles } from "@/components/ui/styles";

export function SpendingSummaryCard({ data }: { data: HomeDashboardData }) {
  const { spending } = data;
  return (
    <section className={cardStyles} aria-labelledby="spending-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="spending-heading" className="text-caption font-semibold text-muted-foreground">
          이번 달({data.currentMonthNumber}월) 결제 예정액
        </h2>
        <span className="rounded-xl bg-primary-subtle px-2 py-1 text-caption font-semibold text-primary">활성 구독 {data.activeSubscriptionCount}개</span>
      </div>
      <p className="mt-2 text-title text-foreground">{spending.formattedDisplay}</p>
      {spending.totalKrw > 0 && spending.totalUsd > 0 ? (
        <p className="mt-1 text-caption text-muted-foreground">원화와 달러는 환산하지 않고 따로 합산해요.</p>
      ) : null}
    </section>
  );
}
