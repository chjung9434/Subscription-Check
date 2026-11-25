import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SubscriptionListItem } from "@/lib/data/subscriptions";
import { formatAmount, formatDate } from "@/lib/format";
import { CYCLE_SUFFIX } from "@/lib/subscriptions/labels";
import { StatusBadge } from "./status-badge";

export function SubscriptionCard({ item }: { item: SubscriptionListItem }) {
  return (
    <Link
      href={`/subscriptions/${item.id}`}
      className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-body font-semibold text-foreground">{item.serviceName}</span>
          <StatusBadge status={item.status} />
        </div>
        <p className="mt-1 text-body text-foreground">
          {formatAmount(item.amount, item.currency)}
          <span className="text-muted-foreground">{CYCLE_SUFFIX[item.billingCycle]}</span>
        </p>
        <p className="mt-1 text-caption text-muted-foreground">
          다음 결제 {formatDate(item.nextBillingDate)}
          {item.paymentMethodMemo ? ` · ${item.paymentMethodMemo}` : ""}
        </p>
      </div>
      <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}
