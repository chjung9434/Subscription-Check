import { BellRing } from "lucide-react";
import { PushSettings } from "@/components/notifications/push-settings";
import { PageHeading } from "@/components/ui/page-heading";
import { cardStyles } from "@/components/ui/styles";
import { getNotificationHistory } from "@/lib/data/notifications";
import { formatSeoulDateTime } from "@/lib/format";

export default async function NotificationsPage() {
  const history = await getNotificationHistory();

  return (
    <>
      <PageHeading title="알림" />
      <div className="flex flex-col gap-6">
        <PushSettings />

        <section aria-labelledby="history-heading" className="flex flex-col gap-3">
          <h2 id="history-heading" className="text-section text-foreground">
            최근 알림
          </h2>
          {history.length === 0 ? (
            <div className={`${cardStyles} flex flex-col items-center gap-2 py-8 text-center`}>
              <BellRing aria-hidden="true" className="size-8 text-muted-foreground" />
              <p className="text-body text-muted-foreground">아직 도착한 결제 알림이 없어요. 다가오는 결제일에 맞춰 미리 알려드릴게요.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {history.map((item) => (
                <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-body font-semibold text-foreground">{item.title}</p>
                    {item.status === "FAILURE" ? (
                      <span className="shrink-0 rounded-xl bg-status-danger-subtle px-2 py-1 text-caption font-semibold text-status-danger-foreground">발송 실패</span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-body text-muted-foreground">{item.body}</p>
                  <p className="mt-2 text-caption text-muted-foreground">
                    <time dateTime={item.sentAt}>{formatSeoulDateTime(item.sentAt)}</time>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
