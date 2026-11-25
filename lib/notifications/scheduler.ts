import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionStatus } from "@/types/database";
import { DEFAULT_DISPATCH_TIME, planSchedules } from "./schedule-plan";

export interface SyncScheduleOptions {
  subscriptionId: string;
  userId: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  useCustomAlert: boolean;
  customAlertDays?: number[] | null;
  customAlertTime?: string | null;
}

/**
 * 구독 하나의 사전 알림 큐를 현재 상태에 맞춘다 (등록·수정·상태 변경·결제 완료 후 호출).
 * - 비활성 구독이거나 알림을 끈 경우: 대기 중(PENDING) 알림 모두 취소
 * - 그 외: 계획된 알림만 대기 상태로 두고 나머지 대기 건은 취소. 이미 발송(SENT)·실패(FAILED)한 건은 다시 만들지 않는다.
 * 요청자의 세션 클라이언트로 실행되므로 RLS가 본인 구독만 허용한다. 실패하면 예외를 던진다.
 */
export async function syncSubscriptionSchedules(options: SyncScheduleOptions, now: Date = new Date()): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const schedules = supabase.from("subscription_notification_schedules");

  const cancelPending = async (keepKeys: string[]) => {
    let query = supabase
      .from("subscription_notification_schedules")
      .update({ status: "CANCELLED" })
      .eq("subscription_id", options.subscriptionId)
      .eq("user_id", options.userId)
      .eq("status", "PENDING");
    if (keepKeys.length > 0) query = query.not("idempotency_key", "in", `(${keepKeys.map((key) => `"${key}"`).join(",")})`);
    const { error } = await query;
    if (error) throw new Error(`schedule cancel failed: ${error.code}`);
  };

  if (options.status !== "ACTIVE") return cancelPending([]);

  let daysBefore: number[];
  let dispatchTime: string;
  if (options.useCustomAlert && options.customAlertDays && options.customAlertDays.length > 0) {
    daysBefore = options.customAlertDays;
    dispatchTime = options.customAlertTime ?? DEFAULT_DISPATCH_TIME;
  } else {
    const { data: prefs, error } = await supabase
      .from("notification_preferences")
      .select("remind_days, dispatch_time, is_enabled")
      .eq("user_id", options.userId)
      .maybeSingle();
    if (error) throw new Error(`preferences read failed: ${error.code}`);
    if (prefs && !prefs.is_enabled) return cancelPending([]);
    daysBefore = prefs?.remind_days ?? [3];
    dispatchTime = prefs?.dispatch_time ?? DEFAULT_DISPATCH_TIME;
  }

  const plan = planSchedules({ subscriptionId: options.subscriptionId, nextBillingDate: options.nextBillingDate, daysBefore, dispatchTime, now });
  const keys = plan.map((item) => item.idempotencyKey);
  await cancelPending(keys);
  if (plan.length === 0) return;

  const { data: existing, error: readError } = await schedules.select("idempotency_key, status").in("idempotency_key", keys);
  if (readError) throw new Error(`schedule read failed: ${readError.code}`);
  const statusByKey = new Map(existing.map((row) => [row.idempotency_key, row.status]));

  for (const item of plan) {
    const current = statusByKey.get(item.idempotencyKey);
    if (current === "SENT" || current === "FAILED") continue;
    const { error } = current
      ? await supabase
          .from("subscription_notification_schedules")
          .update({ status: "PENDING", scheduled_at: item.scheduledAt, retry_count: 0 })
          .eq("idempotency_key", item.idempotencyKey)
          .eq("user_id", options.userId)
          .in("status", ["PENDING", "CANCELLED"])
      : await supabase.from("subscription_notification_schedules").insert({
          subscription_id: options.subscriptionId,
          user_id: options.userId,
          target_date: item.targetDate,
          days_before: item.daysBefore,
          scheduled_at: item.scheduledAt,
          idempotency_key: item.idempotencyKey,
        });
    // 동시에 같은 키가 먼저 들어간 경우(23505)는 이미 예약된 것이므로 통과
    if (error && error.code !== "23505") throw new Error(`schedule write failed: ${error.code}`);
  }
}
