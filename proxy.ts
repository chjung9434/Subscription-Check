import type { NextRequest } from "next/server";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/auth/redirect";
import { redirectWithSession, updateSession } from "@/lib/supabase/proxy";

const PROTECTED_PREFIXES = ["/home", "/subscriptions", "/notifications", "/settings"];
const SIGNED_OUT_ONLY = ["/auth/login"];

const matches = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (!user && matches(pathname, PROTECTED_PREFIXES)) {
    const login = new URL("/auth/login", request.url);
    login.searchParams.set("returnUrl", `${pathname}${search}`);
    return redirectWithSession(login, response);
  }

  if (user && matches(pathname, SIGNED_OUT_ONLY)) {
    return redirectWithSession(new URL(DEFAULT_AFTER_SIGN_IN, request.url), response);
  }

  return response;
}

export const config = {
  // 정적 파일·이미지·폰트는 제외
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)"],
};
