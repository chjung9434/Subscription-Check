import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { requirePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** OAuth·이메일 확인·비밀번호 재설정 링크의 인가 코드를 세션으로 교환한다. */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // 쿠키가 설정된 호스트로 돌아가도록 요청 URL이 아닌 설정된 앱 주소를 기준으로 리다이렉트
  const appUrl = requirePublicEnv("NEXT_PUBLIC_APP_URL");
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));
  const isPasswordReset = next === "/auth/reset-password";

  if (!code) {
    return NextResponse.redirect(new URL(isPasswordReset ? "/auth/reset-password?error=invalid_link" : "/auth/login?error=missing_code", appUrl));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth] exchangeCodeForSession failed", { code: error.code, status: error.status });
    return NextResponse.redirect(new URL(isPasswordReset ? "/auth/reset-password?error=invalid_link" : "/auth/login?error=callback_failed", appUrl));
  }

  return NextResponse.redirect(new URL(next, appUrl));
}
