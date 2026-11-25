import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import { buttonStyles } from "@/components/ui/styles";

export default function HomePage() {
  return (
    <>
      <PageHeading title="홈 대시보드" description="등록된 구독 및 결제 일정을 한눈에 확인하는 공간입니다." />
      <div className="flex flex-col gap-4">
        <PlaceholderCard title="이번 달 결제 예정">
          <p>활성 구독 수와 통화별 결제 예정액, 다가오는 결제 일정이 이곳에 표시될 예정이에요.</p>
        </PlaceholderCard>
        <Link href="/subscriptions/new" className={buttonStyles.primary}>
          <Plus aria-hidden="true" className="size-5" />
          구독 등록
        </Link>
      </div>
    </>
  );
}
