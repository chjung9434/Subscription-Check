import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BackLink href={`/subscriptions/${encodeURIComponent(id)}`} label="상세 정보로" />
      <PageHeading title="구독 정보 수정" />
      <PlaceholderCard title="수정 양식">
        <p>등록한 구독 정보를 고치는 양식이 이곳에 들어갈 예정이에요.</p>
      </PlaceholderCard>
    </>
  );
}
