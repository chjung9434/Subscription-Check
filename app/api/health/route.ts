import { NextResponse } from "next/server";
import { validateProductionEnv } from "@/lib/env/production-check";
import { createSupabasePublicClient } from "@/lib/supabase/public";
import packageJson from "@/package.json";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, no-cache, must-revalidate" };
// 콜드 스타트 직후 첫 연결(TLS 포함)은 1초를 넘길 수 있어 여유를 둔다
const DB_TIMEOUT_MS = 3_000;

/** 배포 상태 점검 (공개). 비밀값·연결 문자열은 응답에 담지 않는다. */
export async function GET() {
  const timestamp = new Date().toISOString();
  const unhealthy = (error: string) => NextResponse.json({ status: "unhealthy", timestamp, error }, { status: 503, headers: NO_STORE });

  const env = validateProductionEnv();
  if (!env.valid) {
    console.error("[health] env invalid", env.errors);
    return unhealthy("ENV_INVALID");
  }

  try {
    const { error, count } = await createSupabasePublicClient()
      .from("subscription_presets")
      .select("id", { count: "exact", head: true })
      .abortSignal(AbortSignal.timeout(DB_TIMEOUT_MS));
    if (error) {
      console.error("[health] database check failed", { code: error.code, message: error.message });
      return unhealthy("DATABASE_UNAVAILABLE");
    }
    if (!count) return unhealthy("PRESETS_MISSING");
  } catch (error) {
    console.error("[health] database check threw", error instanceof Error ? error.name : error);
    return unhealthy("DATABASE_UNAVAILABLE");
  }

  return NextResponse.json(
    { status: "healthy", timestamp, timezone: process.env.NEXT_PUBLIC_TIMEZONE, version: packageJson.version, database: "connected" },
    { headers: NO_STORE },
  );
}
