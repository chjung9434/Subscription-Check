import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import { buttonStyles } from "@/components/ui/styles";

export default function SubscriptionsPage() {
  return (
    <>
      <PageHeading
        title="구독 관리"
        action={
          <Link href="/subscriptions/new" className={buttonStyles.primary}>
            <Plus aria-hidden="true" className="size-5" />
            구독 추가
          </Link>
        }
      />
      <PlaceholderCard title="목록 · 캘린더">
        <p>구독 목록과 월간 결제 캘린더를 전환해서 볼 수 있는 영역이에요. 곧 제공될 예정이에요.</p>
      </PlaceholderCard>
    </>
  );
}
