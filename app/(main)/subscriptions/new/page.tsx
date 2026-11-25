import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export default function NewSubscriptionPage() {
  return (
    <>
      <BackLink href="/subscriptions" label="구독 목록으로" />
      <PageHeading title="새 구독 등록" />
      <PlaceholderCard title="등록 양식">
        <p>서비스명, 결제 금액, 결제 주기, 다음 결제일 등을 입력하는 양식이 이곳에 들어갈 예정이에요.</p>
      </PlaceholderCard>
    </>
  );
}
