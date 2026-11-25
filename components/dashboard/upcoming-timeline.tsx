import Link from "next/link";
import type { UpcomingSubscriptionItem } from "@/lib/dashboard/summary";
import { formatAmount, formatDate } from "@/lib/format";

function DDayBadge({ dDay }: { dDay: number }) {
  const label = dDay === 0 ? "오늘" : `D-${dDay}`;
  const tone =
    dDay === 0
      ? "bg-status-danger-subtle text-status-danger-foreground"
      : dDay <= 3
        ? "bg-status-warning-subtle text-status-warning-foreground"
        : "bg-neutral-subtle text-neutral-foreground";
  return <span className={`inline-flex shrink-0 rounded-xl px-2 py-1 text-caption font-bold ${tone}`}>{label}</span>;
}

export function UpcomingTimeline({ items }: { items: UpcomingSubscriptionItem[] }) {
  return (
    <section aria-labelledby="upcoming-heading" className="flex flex-col gap-3">
      <h2 id="upcoming-heading" className="text-section text-foreground">
        다가오는 결제
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-body text-muted-foreground">오늘 이후 예정된 결제가 없어요.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/subscriptions/${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-foreground">{item.serviceName}</p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {formatDate(item.nextBillingDate)} · {item.category}
                    {item.paymentMethodMemo ? ` · ${item.paymentMethodMemo}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <DDayBadge dDay={item.dDay} />
                  <span className="text-body font-bold text-foreground">{formatAmount(item.amount, item.currency)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
