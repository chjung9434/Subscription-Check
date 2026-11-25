import "server-only";

import { generateRequestDetails } from "web-push";
import type { PushPayload } from "./payload";
import { isAllowedPushEndpoint } from "./push-endpoint";

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export type PushSendResult = { ok: true } | { ok: false; gone: boolean; reason: string };

const SEND_TIMEOUT_MS = 10_000;
const TTL_SECONDS = 24 * 60 * 60;

/** VAPID 설정이 없으면 null (발송 기능 비활성 상태를 화면에서 안내) */
function vapidDetails() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  return publicKey && privateKey && subject ? { publicKey, privateKey, subject } : null;
}

export const isPushConfigured = () => vapidDetails() !== null;

/** 로컬 검증용 가짜 푸시 서버 주소 (운영에서는 비워 둠) */
export const pushTestOrigin = () => process.env.PUSH_TEST_ENDPOINT_ORIGIN || undefined;

/** 한 기기로 암호화된 푸시를 보낸다. 404/410은 만료된 구독(gone). */
export async function sendPush(target: PushTarget, payload: PushPayload): Promise<PushSendResult> {
  const vapid = vapidDetails();
  if (!vapid) return { ok: false, gone: false, reason: "VAPID_NOT_CONFIGURED" };
  if (!isAllowedPushEndpoint(target.endpoint, pushTestOrigin())) return { ok: false, gone: true, reason: "ENDPOINT_NOT_ALLOWED" };

  try {
    const request = generateRequestDetails({ endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } }, JSON.stringify(payload), {
      vapidDetails: vapid,
      TTL: TTL_SECONDS,
      urgency: "normal",
    });
    const response = await fetch(request.endpoint, {
      method: request.method,
      headers: request.headers,
      body: request.body ? new Uint8Array(request.body) : null,
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (response.ok) return { ok: true };
    return { ok: false, gone: response.status === 404 || response.status === 410, reason: `HTTP_${response.status}` };
  } catch (error) {
    return { ok: false, gone: false, reason: error instanceof Error ? error.name : "SEND_ERROR" };
  }
}
