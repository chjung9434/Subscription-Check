import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { requirePublicEnv, SESSION_COOKIE_OPTIONS } from "./env";

/** 요청마다 세션을 검증·갱신하고, 갱신된 쿠키를 담은 응답과 검증된 사용자를 돌려준다. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(requirePublicEnv("NEXT_PUBLIC_SUPABASE_URL"), requirePublicEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookieOptions: SESSION_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // getUser()는 Auth 서버에 토큰을 검증받는다 (getSession() 신뢰 금지)
  const { data, error } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("[proxy] session check failed", { code: error.code, status: error.status });
  }

  return { response, user: data.user };
}

/** 세션 쿠키 변경을 유지한 채 리다이렉트한다. */
export function redirectWithSession(target: URL, sessionResponse: NextResponse) {
  const redirect = NextResponse.redirect(target);
  for (const cookie of sessionResponse.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}
