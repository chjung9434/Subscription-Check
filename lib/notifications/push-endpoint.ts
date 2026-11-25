/**
 * 서버가 요청을 보낼 푸시 엔드포인트를 브라우저 푸시 서비스로만 제한한다 (임의 주소로 요청을 보내게 하는 SSRF 방지).
 * testOrigin: 로컬 검증용 가짜 푸시 서버 주소 (운영에서는 설정하지 않음).
 */
const PUSH_SERVICE_HOSTS = ["fcm.googleapis.com", "android.googleapis.com", "updates.push.services.mozilla.com", "web.push.apple.com"];
const PUSH_SERVICE_SUFFIXES = [".notify.windows.com", ".push.apple.com"];

export function isAllowedPushEndpoint(endpoint: string, testOrigin?: string): boolean {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (testOrigin && url.origin === testOrigin) return true;
  if (url.protocol !== "https:" || url.port !== "" || url.username || url.password) return false;
  return PUSH_SERVICE_HOSTS.includes(url.hostname) || PUSH_SERVICE_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix));
}
