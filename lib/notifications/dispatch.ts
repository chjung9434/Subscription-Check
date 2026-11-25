import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildReminderPayload } from "./payload";
import { sendPush, type PushTarget } from "./web-push";

export const DISPATCH_BATCH_SIZE = 100;
export const MAX_RETRIES = 3;

export interface DispatchSummary {
  success: true;
  processedCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  timestamp: string;
}

/**
 * 발송 시각이 된 대기(PENDING) 알림을 보낸다. 크론 전용 — 호출 전에 CRON_SECRET 인증을 마쳐야 한다.
 * 여러 사용자의 큐를 처리하므로 서비스 롤 클라이언트를 쓴다.
 * 각 행은 updated_at 조건부 갱신으로 먼저 점유해 동시에 실행된 배치가 같은 알림을 두 번 보내지 않게 한다.
 */
export async function dispatchDueNotifications(now: Date = new Date()): Promise<DispatchSummary> {
  const admin = createSupabaseAdminClient();
  const summary: DispatchSummary = { success: true, processedCount: 0, sentCount: 0, failedCount: 0, skippedCount: 0, timestamp: now.toISOString() };

  const { data: due, error } = await admin
    .from("subscription_notification_schedules")
    .select("id, user_id, subscription_id, target_date, days_before, retry_count, updated_at, subscriptions(status, service_name, amount, currency, payment_method_memo)")
    .eq("status", "PENDING")
    .lte("scheduled_at", now.toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(DISPATCH_BATCH_SIZE);
  if (error) throw new Error(`dispatch query failed: ${error.code}`);

  const devicesByUser = new Map<string, PushTarget[]>();
  const setStatus = async (id: string, values: { status?: "SENT" | "FAILED" | "CANCELLED"; retry_count?: number }) => {
    const { error: updateError } = await admin.from("subscription_notification_schedules").update(values).eq("id", id);
    if (updateError) throw new Error(`schedule update failed: ${updateError.code}`);
  };

  for (const row of due) {
    try {
      const { data: claimed, error: claimError } = await admin
        .from("subscription_notification_schedules")
        .update({ retry_count: row.retry_count })
        .eq("id", row.id)
        .eq("status", "PENDING")
        .eq("updated_at", row.updated_at)
        .select("id");
      if (claimError) throw new Error(`claim failed: ${claimError.code}`);
      if (claimed.length === 0) continue; // 다른 배치가 처리 중
      summary.processedCount += 1;

      const subscription = row.subscriptions;
      if (!subscription || subscription.status !== "ACTIVE") {
        await setStatus(row.id, { status: "CANCELLED" });
        summary.skippedCount += 1;
        continue;
      }

      if (!devicesByUser.has(row.user_id)) {
        const { data: devices, error: deviceError } = await admin.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", row.user_id);
        if (deviceError) throw new Error(`device query failed: ${deviceError.code}`);
        devicesByUser.set(row.user_id, devices);
      }
      const devices = devicesByUser.get(row.user_id) ?? [];
      if (devices.length === 0) {
        // 알림을 켠 기기가 없음: 보낼 곳이 없으므로 취소
        await setStatus(row.id, { status: "CANCELLED" });
        summary.skippedCount += 1;
        continue;
      }

      const payload = buildReminderPayload({
        subscriptionId: row.subscription_id,
        serviceName: subscription.service_name,
        amount: subscription.amount,
        currency: subscription.currency,
        paymentMethodMemo: subscription.payment_method_memo,
        targetDate: row.target_date,
        daysBefore: row.days_before,
        now,
      });
      const results = await Promise.all(devices.map((device) => sendPush(device, payload)));

      const goneEndpoints = devices.filter((_, index) => {
        const result = results[index];
        return !result.ok && result.gone;
      });
      if (goneEndpoints.length > 0) {
        const endpoints = goneEndpoints.map((device) => device.endpoint);
        await admin.from("push_subscriptions").delete().in("endpoint", endpoints);
        devicesByUser.set(
          row.user_id,
          devices.filter((device) => !endpoints.includes(device.endpoint)),
        );
      }

      if (results.some((result) => result.ok)) {
        await setStatus(row.id, { status: "SENT" });
        await admin.from("notification_logs").insert({ user_id: row.user_id, subscription_id: row.subscription_id, title: payload.title, body: payload.body });
        summary.sentCount += 1;
      } else if (goneEndpoints.length === devices.length) {
        await setStatus(row.id, { status: "CANCELLED" });
        summary.skippedCount += 1;
      } else {
        const retryCount = row.retry_count + 1;
        const reason = results.map((result) => (result.ok ? "OK" : result.reason)).join(",");
        if (retryCount >= MAX_RETRIES) {
          await setStatus(row.id, { status: "FAILED", retry_count: retryCount });
          await admin.from("notification_logs").insert({
            user_id: row.user_id,
            subscription_id: row.subscription_id,
            title: payload.title,
            body: payload.body,
            status: "FAILURE",
            error_message: reason.slice(0, 500),
          });
          summary.failedCount += 1;
        } else {
          await setStatus(row.id, { retry_count: retryCount });
        }
      }
    } catch (rowError) {
      console.error("[dispatch] schedule failed", { id: row.id, message: rowError instanceof Error ? rowError.message : String(rowError) });
      summary.failedCount += 1;
    }
  }

  return summary;
}
