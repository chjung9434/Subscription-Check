/** 서버 시작 시 1회: 운영 환경에서 필수 설정이 빠졌으면 기동을 멈춰 배포 단계에서 바로 드러나게 한다. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NODE_ENV !== "production") return;
  const { validateProductionEnv } = await import("./lib/env/production-check");
  const result = validateProductionEnv();
  for (const warning of result.warnings ?? []) console.warn(`[env] ${warning}`);
  if (!result.valid) {
    for (const error of result.errors ?? []) console.error(`[env] ${error}`);
    throw new Error("필수 환경 변수가 없거나 잘못되어 서버를 시작할 수 없습니다. 위 [env] 로그를 확인하세요.");
  }
}
