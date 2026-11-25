import { connection } from "next/server";
import { EMPTY_FORM, SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { createSubscriptionAction } from "@/lib/actions/subscriptions";
import { getSubscriptionPresets } from "@/lib/presets/catalog";

export default async function NewSubscriptionPage() {
  // 요청 시점에 렌더링 (빌드 시점 결과·실패가 정적 페이지로 굳지 않게). 데이터는 getSubscriptionPresets가 24시간 캐시.
  await connection();
  const presets = await getSubscriptionPresets();

  return (
    <>
      <BackLink href="/subscriptions" label="구독 목록으로" />
      <PageHeading title="새 구독 등록" />
      <SubscriptionForm action={createSubscriptionAction} initial={EMPTY_FORM} presets={presets} submitLabel="구독 저장하기" />
    </>
  );
}
