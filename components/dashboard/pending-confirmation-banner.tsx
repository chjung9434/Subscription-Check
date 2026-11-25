"use client";

import { CircleAlert, CircleCheck, RotateCw } from "lucide-react";
import { useState, useTransition } from "react";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles } from "@/components/ui/styles";
import { confirmSubscriptionPaymentAction } from "@/lib/actions/payments";
import type { PendingConfirmationSubscriptionItem } from "@/lib/dashboard/pending";
import { formatAmount, formatDate } from "@/lib/format";

const DONE_MESSAGE_MS = 2_000;

export function PendingConfirmationBanner({ items }: { items: PendingConfirmationSubscriptionItem[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [allDone, setAllDone] = useState(false);
  const [, startTransition] = useTransition();

  const confirm = (item: PendingConfirmationSubscriptionItem) => {
    setPendingId(item.id);
    setErrors((prev) => ({ ...prev, [item.id]: "" }));
    startTransition(async () => {
      try {
        const result = await confirmSubscriptionPaymentAction({ subscriptionId: item.id, expectedCurrentNextBillingDate: item.nextBillingDate });
        if (!result.success) {
          setErrors((prev) => ({ ...prev, [item.id]: result.error.message }));
        } else if (items.length === 1) {
          setAllDone(true);
          window.setTimeout(() => setAllDone(false), DONE_MESSAGE_MS);
        }
      } catch {
        // 네트워크 단절 등으로 서버 액션 호출 자체가 실패한 경우
        setErrors((prev) => ({ ...prev, [item.id]: "결제 완료 처리에 실패했습니다. 다시 시도해 주세요." }));
      } finally {
        setPendingId(null);
      }
    });
  };

  if (items.length === 0) {
    return allDone ? (
      <p role="status" className="flex items-center gap-2 rounded-xl bg-status-success-subtle p-4 text-body text-status-success-foreground">
        <CircleCheck aria-hidden="true" className="size-5 shrink-0" />
        모든 결제 확인이 완료되었어요!
      </p>
    ) : null;
  }

  return (
    <section aria-labelledby="pending-heading" className="rounded-xl border border-status-warning bg-status-warning-subtle p-4">
      <h2 id="pending-heading" className="flex items-center gap-2 text-section text-status-warning-foreground">
        <CircleAlert aria-hidden="true" className="size-5 shrink-0" />
        결제 확인이 필요한 구독 {items.length}건
      </h2>
      <p className="mt-1 text-body text-foreground">예정된 결제가 정상적으로 진행되었는지 확인해 주세요.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((item) => {
          const busy = pendingId === item.id;
          const error = errors[item.id];
          return (
            <li key={`${item.id}-${item.nextBillingDate}`} className="rounded-xl bg-surface p-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-foreground">
                    {item.serviceName} <span className="font-bold">{formatAmount(item.amount, item.currency)}</span>
                  </p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    {item.category}
                    {item.paymentMethodMemo ? ` · ${item.paymentMethodMemo}` : ""}
                  </p>
                  <p className="mt-1 text-caption font-semibold text-status-warning-foreground">
                    원래 결제일: {formatDate(item.nextBillingDate)} ({item.overdueDays}일 지남)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => confirm(item)}
                  disabled={pendingId !== null}
                  aria-describedby={error ? `pending-error-${item.id}` : undefined}
                  className={`${buttonStyles.primary} shrink-0`}
                >
                  {busy ? <Spinner /> : error ? <RotateCw aria-hidden="true" className="size-4" /> : null}
                  {busy ? "처리 중..." : error ? "다시 시도" : "결제 완료"}
                </button>
              </div>
              {error ? (
                <p id={`pending-error-${item.id}`} role="alert" className="mt-2 text-caption text-status-danger-foreground">
                  {error}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
