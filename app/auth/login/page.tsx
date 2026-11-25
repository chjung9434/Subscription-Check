import Link from "next/link";
import { buttonStyles, inputStyles } from "@/components/ui/styles";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-title text-foreground">구독체크 로그인</h1>
      <p id="login-note" className="mt-2 text-body text-muted-foreground">
        로그인 기능은 준비 중이에요. 곧 이메일이나 간편 로그인으로 시작할 수 있어요.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <button type="button" disabled aria-describedby="login-note" className={buttonStyles.secondary}>
          Google로 계속하기
        </button>
        <button type="button" disabled aria-describedby="login-note" className={buttonStyles.secondary}>
          카카오로 계속하기
        </button>
        <button type="button" disabled aria-describedby="login-note" className={buttonStyles.secondary}>
          네이버로 계속하기
        </button>
      </div>

      <form className="mt-6 flex flex-col gap-4" aria-describedby="login-note">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-caption font-semibold text-foreground">
            이메일
          </label>
          <input id="email" type="email" autoComplete="email" disabled className={inputStyles} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-caption font-semibold text-foreground">
            비밀번호
          </label>
          <input id="password" type="password" autoComplete="current-password" disabled className={inputStyles} />
        </div>
        <button type="submit" disabled className={buttonStyles.primary}>
          로그인
        </button>
      </form>

      <Link href="/auth/reset-password" className={`${buttonStyles.ghost} mt-4 w-full`}>
        비밀번호를 잊으셨나요?
      </Link>
    </>
  );
}
