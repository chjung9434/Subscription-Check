export const DEFAULT_AFTER_SIGN_IN = "/home";

/**
 * 로그인 후 이동할 경로를 같은 사이트 안의 경로로만 제한한다 (open redirect 방지).
 * "/"로 시작하고 "//"·"/\\"(프로토콜 상대 URL)가 아닌 값만 허용.
 */
export function safeRedirectPath(value: unknown, fallback: string = DEFAULT_AFTER_SIGN_IN): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
