import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil } from "lucide-react";
import { DeleteSubscriptionButton } from "@/components/subscriptions/delete-subscription-button";
import { SavedNotice } from "@/components/subscriptions/saved-notice";
import { StatusBadge } from "@/components/subscriptions/status-badge";
import { BackLink } from "@/components/ui/back-link";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { getSubscriptionDetail } from "@/lib/data/subscriptions";
import { formatAmount, formatDate } from "@/lib/format";
import { CYCLE_LABELS } from "@/lib/subscriptions/labels";

export default async function SubscriptionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, { saved }] = await Promise.all([params, searchParams]);
  const subscription = await getSubscriptionDetail(id);
  if (!subscription) notFound();

  const rows: [string, string][] = [
    ["카테고리", subscription.category],
    ["결제 금액", formatAmount(subscription.amount, subscription.currency)],
    ["결제 주기", CYCLE_LABELS[subscription.billingCycle]],
    ["다음 결제 예정일", formatDate(subscription.nextBillingDate)],
    ["결제 수단 메모", subscription.paymentMethodMemo ?? "없음"],
  ];

  return (
    <>
      <BackLink href="/subscriptions" label="구독 목록으로" />
      <SavedNotice saved={saved} />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title text-foreground">{subscription.serviceName}</h1>
          <div className="mt-2">
            <StatusBadge status={subscription.status} />
          </div>
        </div>
        <Link href={`/subscriptions/${subscription.id}/edit`} className={`${buttonStyles.secondary} shrink-0`}>
          <Pencil aria-hidden="true" className="size-4" />
          수정
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <section className={cardStyles} aria-label="구독 정보">
          <dl className="flex flex-col gap-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4">
                <dt className="shrink-0 text-body text-muted-foreground">{label}</dt>
                <dd className="text-right text-body text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          {subscription.memo ? <p className="mt-4 border-t border-border pt-4 text-body whitespace-pre-line text-foreground">{subscription.memo}</p> : null}
        </section>

        {subscription.presetGuide ? (
          <section className={cardStyles} aria-labelledby="guide-heading">
            <h2 id="guide-heading" className="text-section text-foreground">
              해지 가이드
            </h2>
            <p className="mt-2 text-body whitespace-pre-line text-muted-foreground">{subscription.presetGuide.guideText}</p>
            <a
              href={subscription.presetGuide.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonStyles.secondary} mt-4 w-full`}
            >
              공식 해지 페이지 바로가기
              <ExternalLink aria-hidden="true" className="size-4" />
              <span className="sr-only">(새 탭에서 열림)</span>
            </a>
          </section>
        ) : null}

        <DeleteSubscriptionButton id={subscription.id} serviceName={subscription.serviceName} />
      </div>
    </>
  );
}
