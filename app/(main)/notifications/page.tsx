import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";

export default function NotificationsPage() {
  return (
    <>
      <PageHeading title="알림 내역" />
      <PlaceholderCard title="받은 알림">
        <p>결제 사전 알림 이력과 알림 시점·시간 설정이 이곳에 표시될 예정이에요.</p>
      </PlaceholderCard>
    </>
  );
}
