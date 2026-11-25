import { addDays, seoulDateTimeToIso } from "@/lib/time/seoul";

export const DEFAULT_DISPATCH_TIME = "08:00:00";

export interface PlannedSchedule {
  daysBefore: 1 | 3 | 7;
  /** 결제 예정일 */
  targetDate: string;
  /** 발송 시각 (UTC ISO) */
  scheduledAt: string;
  idempotencyKey: string;
}

export const scheduleKey = (subscriptionId: string, targetDate: string, daysBefore: number) => `${subscriptionId}_${targetDate}_${daysBefore}`;

/**
 * 결제 예정일 N일 전 서울 시각 dispatchTime에 보낼 알림 목록. 이미 지난 시각은 만들지 않는다.
 */
export function planSchedules(input: {
  subscriptionId: string;
  nextBillingDate: string;
  daysBefore: readonly number[];
  dispatchTime: string;
  now: Date;
}): PlannedSchedule[] {
  const unique = [...new Set(input.daysBefore)].filter((day): day is 1 | 3 | 7 => day === 1 || day === 3 || day === 7).sort((a, b) => b - a);
  return unique
    .map((daysBefore) => ({
      daysBefore,
      targetDate: input.nextBillingDate,
      scheduledAt: seoulDateTimeToIso(addDays(input.nextBillingDate, -daysBefore), input.dispatchTime),
      idempotencyKey: scheduleKey(input.subscriptionId, input.nextBillingDate, daysBefore),
    }))
    .filter((plan) => new Date(plan.scheduledAt).getTime() > input.now.getTime());
}
