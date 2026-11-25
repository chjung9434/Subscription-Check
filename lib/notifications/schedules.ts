import "server-only";

/**
 * 구독 등록·수정·삭제 후 결제 사전 알림 스케줄을 다시 맞추는 계약 지점.
 * 실제 스케줄 적재는 '웹 푸시 기반 결제 사전 알림 스케줄링 및 발송 시스템 구축' 작업에서 구현한다.
 * 그 전까지는 아무 일도 하지 않으며(알림 미발송 상태), 삭제 시 기존 스케줄은 FK cascade로 지워진다.
 */
export async function syncSubscriptionSchedules(subscriptionId: string): Promise<void> {
  void subscriptionId;
}
