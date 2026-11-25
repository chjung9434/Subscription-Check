import { EMPTY_FORM, SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { createSubscriptionAction } from "@/lib/actions/subscriptions";
import { getPresetOptions } from "@/lib/data/subscriptions";

export default async function NewSubscriptionPage() {
  const presets = await getPresetOptions();

  return (
    <>
      <BackLink href="/subscriptions" label="구독 목록으로" />
      <PageHeading title="새 구독 등록" />
      <SubscriptionForm action={createSubscriptionAction} initial={EMPTY_FORM} presets={presets} submitLabel="구독 저장하기" />
    </>
  );
}
