import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { dispatchDueNotifications } from "@/lib/notifications/dispatch";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** 크론 전용: 발송 시각이 된 결제 사전 알림 일괄 발송 (Authorization: Bearer CRON_SECRET) */
async function handle(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[dispatch] CRON_SECRET is not configured");
    return NextResponse.json({ success: false, error: { code: "NOT_CONFIGURED", message: "Dispatch is not configured." } }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
  }
  try {
    return NextResponse.json(await dispatchDueNotifications());
  } catch (error) {
    console.error("[dispatch] batch failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Dispatch failed." } }, { status: 500 });
  }
}

export const POST = handle;
// 크론 서비스(예: Vercel Cron)는 GET으로 호출하므로 같은 인증으로 허용
export const GET = handle;
