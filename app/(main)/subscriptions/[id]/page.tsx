import Link from "next/link";
import { Pencil } from "lucide-react";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import { buttonStyles } from "@/components/ui/styles";

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <BackLink href="/subscriptions" label="구독 목록으로" />
      <PageHeading
        title="구독 상세 정보"
        action={
          <Link href={`/subscriptions/${encodeURIComponent(id)}/edit`} className={buttonStyles.secondary}>
            <Pencil aria-hidden="true" className="size-4" />
            수정하기
          </Link>
        }
      />
      <PlaceholderCard title="상세 · 해지 가이드">
        <p>구독 정보와 단계별 해지 방법, 공식 해지 페이지 바로가기가 이곳에 표시될 예정이에요.</p>
      </PlaceholderCard>
    </>
  );
}
