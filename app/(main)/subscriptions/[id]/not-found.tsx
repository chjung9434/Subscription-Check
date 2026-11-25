import Link from "next/link";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

export default function SubscriptionNotFound() {
  return (
    <section className={`${cardStyles} flex flex-col items-start gap-4`}>
      <h1 className="text-section text-foreground">구독 정보를 찾을 수 없습니다.</h1>
      <p className="text-body text-muted-foreground">삭제되었거나 접근할 수 없는 구독이에요.</p>
      <Link href="/subscriptions" className={buttonStyles.secondary}>
        구독 목록으로 돌아가기
      </Link>
    </section>
  );
}
