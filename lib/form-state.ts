export type FieldErrors = Partial<Record<string, string>>;

/**
 * 서버 액션이 폼에 돌려주는 결과. 성공 시 대부분 redirect 하므로 success는 안내 메시지가 필요한 경우만 쓴다.
 * email: 폼 액션 후 React가 입력값을 초기화하므로, 오류 시 다시 채울 이메일 (인증 폼).
 */
export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; code: string; message: string; fieldErrors?: FieldErrors; email?: string };

export const IDLE: FormState = { status: "idle" };
