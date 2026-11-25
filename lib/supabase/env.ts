type PublicEnvName = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY" | "NEXT_PUBLIC_APP_URL";

// NEXT_PUBLIC_ 값은 빌드 시 인라인되므로 이름을 직접 적어 읽는다.
const values: Record<PublicEnvName, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

export function requirePublicEnv(name: PublicEnvName): string {
  const value = values[name];
  if (!value) {
    throw new Error(`${name} 환경 변수가 없습니다. .env.example을 참고해 .env.local에 설정하세요.`);
  }
  return value;
}

/**
 * 세션 쿠키: 브라우저용 Supabase 클라이언트를 쓰지 않고 서버에서만 세션을 다루므로 JS에서 읽을 수 없게 한다.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
