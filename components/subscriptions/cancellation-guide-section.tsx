import { CircleCheck, ExternalLink, Info } from "lucide-react";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { parseGuideText } from "@/lib/validations/cancellation-report";
import type { SubscriptionStatus } from "@/types/database";
import { CancellationReportButton } from "./cancellation-report-modal";
import { TerminateSubscriptionButton } from "./terminate-subscription-button";

/** 공식 해지 페이지로 가는 새 탭 링크 (opener·referrer 차단) */
function DirectOutlinkButton({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${buttonStyles.primary} w-full`}>
      공식 해지 페이지 바로가기
      <ExternalLink aria-hidden="true" className="size-4" />
      <span className="sr-only">(새 탭에서 열림)</span>
    </a>
  );
}

export function CancellationGuideSection({
  subscriptionId,
  serviceName,
  status,
  guide,
}: {
  subscriptionId: string;
  serviceName: string;
  status: SubscriptionStatus;
  guide: { guideText: string; officialUrl: string } | null;
}) {
  const parsed = guide ? parseGuideText(guide.guideText) : null;

  return (
    <section className={cardStyles} aria-labelledby="guide-heading">
      <h2 id="guide-heading" className="text-section text-foreground">
        해지 가이드
      </h2>
      {status === "TERMINATED" ? (
        <p role="status" className="mt-2 flex items-start gap-2 rounded-xl bg-status-success-subtle p-3 text-body text-status-success-foreground">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          종료된 구독이에요. 결제 예정액 계산과 결제 알림에서 제외돼요.
        </p>
      ) : null}

      {guide && parsed ? (
        <>
          {parsed.steps.length > 0 ? (
            <ol className="mt-3 flex flex-col gap-3">
              {parsed.steps.map((step, index) => (
                <li key={step} className="flex gap-3 text-body text-foreground">
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-caption font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {parsed.notes.map((note) => (
            <p key={note} className="mt-3 flex gap-2 text-caption text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {note}
            </p>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <DirectOutlinkButton href={guide.officialUrl} />
            {status !== "TERMINATED" ? <TerminateSubscriptionButton id={subscriptionId} serviceName={serviceName} /> : null}
            <CancellationReportButton subscriptionId={subscriptionId} serviceName={serviceName} label="경로가 변경되었나요? 제보하기" title="해지 경로 변경 제보" />
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-body text-muted-foreground">해당 서비스는 직접 등록된 구독으로 전용 해지 가이드가 제공되지 않습니다.</p>
          <p className="mt-1 text-caption text-muted-foreground">
            검색 포털에서 &lsquo;{serviceName} 해지 방법&rsquo;을 찾아보거나, 서비스의 계정·결제 설정 메뉴에서 해지할 수 있어요.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            {status !== "TERMINATED" ? <TerminateSubscriptionButton id={subscriptionId} serviceName={serviceName} /> : null}
            <CancellationReportButton subscriptionId={subscriptionId} serviceName={serviceName} label="이 서비스의 해지 가이드 추가 요청하기" title="해지 가이드 추가 요청" />
          </div>
        </>
      )}
    </section>
  );
}
