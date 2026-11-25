import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requirePublicEnv } from "./env";

/**
 * 서비스 롤 클라이언트 (RLS 우회). 서버에서만, 호출 전에 요청자 신원과 대상 리소스 권한을 확인한 뒤 사용한다.
 * 현재 용도: 본인 확인을 마친 회원 탈퇴의 auth 사용자 삭제.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.");
  }
  return createClient<Database>(requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"), serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
