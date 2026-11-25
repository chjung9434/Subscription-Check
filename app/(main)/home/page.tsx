import Link from "next/link";
import { Plus } from "lucide-react";
import { PendingConfirmationBanner } from "@/components/dashboard/pending-confirmation-banner";
import { SpendingSummaryCard } from "@/components/dashboard/spending-summary-card";
import { UpcomingTimeline } from "@/components/dashboard/upcoming-timeline";
import { PageHeading } from "@/components/ui/page-heading";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { getHomeDashboardSummary, getPendingConfirmationSubscriptions } from "@/lib/data/dashboard";

export default async function HomePage() {
  const [data, pending] = await Promise.all([getHomeDashboardSummary(), getPendingConfirmationSubscriptions()]);

  if (data.activeSubscriptionCount === 0) {
    return (
      <>
        <PageHeading title="홈" />
        <section className={`${cardStyles} flex flex-col items-center gap-4 py-10 text-center`}>
          <div>
            <h2 className="text-section text-foreground">아직 등록된 구독이 없어요</h2>
            <p className="mt-1 text-body text-muted-foreground">이용 중인 OTT, SaaS, 정기 결제를 등록하고 이번 달 지출을 확인해 보세요.</p>
          </div>
          <Link href="/subscriptions/new" className={buttonStyles.primary}>
            <Plus aria-hidden="true" className="size-5" />첫 구독 등록하기
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeading
        title="홈"
        action={
          <Link href="/subscriptions/new" className={buttonStyles.primary}>
            <Plus aria-hidden="true" className="size-5" />
            구독 추가하기
          </Link>
        }
      />
      <div className="flex flex-col gap-6">
        <PendingConfirmationBanner items={pending} />
        <SpendingSummaryCard data={data} />
        <UpcomingTimeline items={data.upcomingList} />
      </div>
    </>
  );
}
