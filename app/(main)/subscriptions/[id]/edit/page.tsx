import { notFound } from "next/navigation";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { updateSubscriptionAction } from "@/lib/actions/subscriptions";
import { getSubscriptionDetail } from "@/lib/data/subscriptions";

export default async function EditSubscriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subscription = await getSubscriptionDetail(id);
  if (!subscription) notFound();

  return (
    <>
      <BackLink href={`/subscriptions/${subscription.id}`} label="상세 정보로" />
      <PageHeading title="구독 정보 수정" />
      <SubscriptionForm
        action={updateSubscriptionAction}
        subscriptionId={subscription.id}
        submitLabel="수정 완료"
        initial={{
          presetId: subscription.presetId,
          serviceName: subscription.serviceName,
          category: subscription.category,
          amount: String(subscription.amount),
          currency: subscription.currency,
          billingCycle: subscription.billingCycle,
          nextBillingDate: subscription.nextBillingDate,
          paymentMethodMemo: subscription.paymentMethodMemo ?? "",
          memo: subscription.memo ?? "",
          status: subscription.status,
        }}
      />
    </>
  );
}
