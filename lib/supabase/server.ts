import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

function requireEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY"): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 없습니다. .env.example을 참고해 .env.local에 설정하세요.`);
  }
  return value;
}

/**
 * 요청마다 새로 만드는 서버용 Supabase 클라이언트 (사용자 세션 쿠키 기반, RLS 적용).
 * 권한 판단은 반드시 supabase.auth.getClaims()/getUser()로 확인한 신원으로 한다.
 * 세션 갱신용 proxy(미들웨어)는 인증 작업에서 추가한다. 그 전에는 Server Component에서
 * 토큰 갱신 쿠키를 쓸 수 없어 Next.js 오류가 그대로 드러난다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
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
