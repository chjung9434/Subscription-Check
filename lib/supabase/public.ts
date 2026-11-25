import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requirePublicEnv } from "./env";

/** 쿠키·세션 없이 공개 데이터만 읽는 anon 클라이언트 (요청 간 캐시 가능한 조회용, RLS 적용) */
export function createSupabasePublicClient() {
  return createClient<Database>(requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"), requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
