// 공통 컨트롤 스타일 (디자인 토큰 역할 이름만 사용)
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-body font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export const buttonStyles = {
  primary: `${base} bg-primary text-primary-foreground`,
  secondary: `${base} border border-border-strong bg-surface text-foreground`,
  ghost: `${base} px-2 text-muted-foreground hover:text-foreground`,
} as const;

export const inputStyles =
  "min-h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-body text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-background";

export const cardStyles = "rounded-xl border border-border bg-surface p-4";

export const dangerButtonStyles = `${base} bg-status-danger text-primary-foreground`;
export const kakaoButtonStyles = `${base} bg-kakao text-kakao-foreground`;
