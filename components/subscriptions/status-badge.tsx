import { STATUS_LABELS } from "@/lib/subscriptions/labels";
import type { SubscriptionStatus } from "@/types/database";

const STYLES: Record<SubscriptionStatus, string> = {
  ACTIVE: "bg-status-success-subtle text-status-success-foreground",
  PAUSED: "bg-status-warning-subtle text-status-warning-foreground",
  TERMINATED: "bg-neutral-subtle text-neutral-foreground",
};

/** 상태는 색과 글자로 함께 표시 */
export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  return <span className={`inline-flex shrink-0 items-center rounded-xl px-2 py-1 text-caption font-semibold ${STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}
