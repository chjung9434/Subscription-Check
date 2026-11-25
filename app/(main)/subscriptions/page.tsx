import Link from "next/link";
import { Plus } from "lucide-react";
import { SavedNotice } from "@/components/subscriptions/saved-notice";
import { SubscriptionCard } from "@/components/subscriptions/subscription-card";
import { PageHeading } from "@/components/ui/page-heading";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { getSubscriptionsList } from "@/lib/data/subscriptions";

export default async function SubscriptionsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ saved, notify }, items] = await Promise.all([searchParams, getSubscriptionsList()]);

  return (
    <>
      <PageHeading
        title="구독 관리"
        action={
          items.length > 0 ? (
            <Link href="/subscriptions/new" className={buttonStyles.primary}>
              <Plus aria-hidden="true" className="size-5" />
              구독 추가
            </Link>
          ) : null
        }
      />
      <SavedNotice saved={saved} notify={notify} />
      {items.length === 0 ? (
        <section className={`${cardStyles} flex flex-col items-center gap-4 py-10 text-center`}>
          <div>
            <h2 className="text-section text-foreground">등록된 구독 서비스가 없어요</h2>
            <p className="mt-1 text-body text-muted-foreground">자주 쓰는 서비스를 등록하고 결제일을 관리해 보세요!</p>
          </div>
          <Link href="/subscriptions/new" className={buttonStyles.primary}>
            <Plus aria-hidden="true" className="size-5" />첫 구독 등록하기
          </Link>
        </section>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="구독 목록 (다음 결제일 순)">
          {items.map((item) => (
            <li key={item.id}>
              <SubscriptionCard item={item} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
