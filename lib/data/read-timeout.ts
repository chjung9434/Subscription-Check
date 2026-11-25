/** 화면 데이터 조회의 전체 대기 상한 (재시도 포함). 넘으면 요청을 중단해 오류 화면과 재시도를 보여준다. */
const READ_TIMEOUT_MS = 8_000;

export const readTimeout = () => AbortSignal.timeout(READ_TIMEOUT_MS);
