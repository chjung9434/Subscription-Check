import type { OAuthProvider } from "@/lib/validations/auth";

type Env = Record<string, string | undefined>;

const REQUIRED_KEYS: Record<OAuthProvider, readonly string[]> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  kakao: ["KAKAO_CLIENT_ID", "KAKAO_CLIENT_SECRET"],
  naver: ["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"],
};

/** Supabase Auth가 기본 제공하는 제공자만 실제 로그인이 가능하다. 네이버는 별도 연동이 필요하다. */
const SUPPORTED_BY_SUPABASE: Record<OAuthProvider, boolean> = {
  google: true,
  kakao: true,
  naver: false,
};

export function isOAuthProviderReady(provider: OAuthProvider, env: Env = process.env): boolean {
  return SUPPORTED_BY_SUPABASE[provider] && REQUIRED_KEYS[provider].every((key) => Boolean(env[key]));
}
