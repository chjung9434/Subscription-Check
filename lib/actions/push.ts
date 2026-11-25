"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { buildTestPayload } from "@/lib/notifications/payload";
import { isAllowedPushEndpoint } from "@/lib/notifications/push-endpoint";
import { isPushConfigured, pushTestOrigin, sendPush } from "@/lib/notifications/web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const PushSubscriptionInputSchema = z.object({
  endpoint: z.url("올바른 푸시 엔드포인트 URL이어야 합니다.").max(1000),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh 키가 누락되었습니다.").max(200),
    auth: z.string().min(1, "auth 키가 누락되었습니다.").max(100),
  }),
  userAgent: z.string().max(255).optional(),
});
export type PushSubscriptionInput = z.infer<typeof PushSubscriptionInputSchema>;

export type PushActionResult = { success: true; message: string } | { success: false; error: { code: string; message: string } };

const fail = (code: string, message: string): PushActionResult => ({ success: false, error: { code, message } });
const REGISTER_FAILED = "알림 등록에 실패했습니다. 다시 시도해 주세요.";

async function currentUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, userId: data.user?.id ?? null };
}

/** 이 브라우저의 푸시 구독을 로그인 사용자에게 연결한다 (기기당 엔드포인트 1개) */
export async function registerPushSubscriptionAction(input: PushSubscriptionInput): Promise<PushActionResult> {
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("UNAUTHORIZED", "로그인이 필요해요. 다시 로그인해 주세요.");

  const parsed = PushSubscriptionInputSchema.safeParse(input);
  if (!parsed.success || !isAllowedPushEndpoint(parsed.data.endpoint, pushTestOrigin())) return fail("INVALID_SUBSCRIPTION", REGISTER_FAILED);
  const { endpoint, keys, userAgent } = parsed.data;
  const row = { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, user_agent: userAgent ?? null };

  let { error } = await supabase.from("push_subscriptions").upsert(row, { onConflict: "endpoint" });
  if (error?.code === "42501") {
    // 같은 브라우저를 이전에 다른 계정이 등록함. 엔드포인트는 그 브라우저만 받을 수 있는 값이므로 소유가 증명된다:
    // 이전 연결만 서비스 롤로 지우고 현재 사용자로 다시 등록한다.
    const { error: deleteError } = await createSupabaseAdminClient().from("push_subscriptions").delete().eq("endpoint", endpoint).neq("user_id", userId);
    if (deleteError) {
      console.error("[push] handover delete failed", { code: deleteError.code });
      return fail("REGISTER_FAILED", REGISTER_FAILED);
    }
    ({ error } = await supabase.from("push_subscriptions").upsert(row, { onConflict: "endpoint" }));
  }
  if (error) {
    console.error("[push] register failed", { code: error.code });
    return fail("REGISTER_FAILED", REGISTER_FAILED);
  }
  return { success: true, message: "푸시 알림 등록이 완료되었습니다." };
}

export async function unregisterPushSubscriptionAction(input: { endpoint: string }): Promise<PushActionResult> {
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("UNAUTHORIZED", "로그인이 필요해요. 다시 로그인해 주세요.");
  const endpoint = z.url().max(1000).safeParse(input.endpoint);
  if (!endpoint.success) return fail("INVALID_SUBSCRIPTION", "알림을 끄지 못했어요. 다시 시도해 주세요.");

  const { error } = await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint.data).eq("user_id", userId);
  if (error) {
    console.error("[push] unregister failed", { code: error.code });
    return fail("UNREGISTER_FAILED", "알림을 끄지 못했어요. 다시 시도해 주세요.");
  }
  return { success: true, message: "이 기기의 알림을 껐어요." };
}

/** 로그인 사용자의 모든 알림 기기로 테스트 알림을 보낸다 */
export async function sendTestPushAction(): Promise<PushActionResult> {
  const { supabase, userId } = await currentUser();
  if (!userId) return fail("UNAUTHORIZED", "로그인이 필요해요. 다시 로그인해 주세요.");
  if (!isPushConfigured()) return fail("NOT_CONFIGURED", "알림 발송 설정이 아직 완료되지 않았어요.");

  const { data: devices, error } = await supabase.from("push_subscriptions").select("endpoint, p256dh, auth").eq("user_id", userId);
  if (error) {
    console.error("[push] device query failed", { code: error.code });
    return fail("SEND_FAILED", "테스트 알림을 보내지 못했어요. 다시 시도해 주세요.");
  }
  if (devices.length === 0) return fail("NO_SUBSCRIPTION_FOUND", "알림을 켠 기기가 없어요. 먼저 알림을 켜 주세요.");

  const payload = buildTestPayload(new Date());
  const results = await Promise.all(devices.map((device) => sendPush(device, payload)));
  const gone = devices.filter((_, index) => {
    const result = results[index];
    return !result.ok && result.gone;
  });
  if (gone.length > 0) {
    await supabase.from("push_subscriptions").delete().eq("user_id", userId).in("endpoint", gone.map((device) => device.endpoint));
  }
  if (!results.some((result) => result.ok)) {
    console.error("[push] test send failed", { reasons: results.map((result) => (result.ok ? "OK" : result.reason)) });
    return fail(
      "SEND_FAILED",
      gone.length === devices.length ? "알림 등록이 만료되었어요. 알림을 다시 켜 주세요." : "테스트 알림을 보내지 못했어요. 다시 시도해 주세요.",
    );
  }

  const { error: logError } = await supabase.from("notification_logs").insert({ user_id: userId, title: payload.title, body: payload.body });
  if (logError) console.error("[push] test log insert failed", { code: logError.code });
  revalidatePath("/notifications");
  return { success: true, message: "테스트 푸시가 성공적으로 발송되었습니다." };
}
