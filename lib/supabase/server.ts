import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { requirePublicEnv, SESSION_COOKIE_OPTIONS } from "./env";

/**
 * 요청마다 새로 만드는 서버용 Supabase 클라이언트 (사용자 세션 쿠키 기반, RLS 적용).
 * 권한 판단은 반드시 supabase.auth.getUser()로 확인한 신원으로 한다.
 * 세션 갱신은 proxy.ts가 매 요청 앞단에서 처리하므로 Server Component에서는 쿠키를 쓸 일이 없다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"), requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}
