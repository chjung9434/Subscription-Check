import Link from "next/link";
import { buttonStyles, inputStyles } from "@/components/ui/styles";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-title text-foreground">비밀번호 재설정</h1>
      <p id="reset-note" className="mt-2 text-body text-muted-foreground">
        가입한 이메일로 재설정 링크를 보내는 기능은 준비 중이에요.
      </p>

      <form className="mt-6 flex flex-col gap-4" aria-describedby="reset-note">
        <div className="flex flex-col gap-1">
          <label htmlFor="reset-email" className="text-caption font-semibold text-foreground">
            이메일
          </label>
          <input id="reset-email" type="email" autoComplete="email" disabled className={inputStyles} />
        </div>
        <button type="submit" disabled className={buttonStyles.primary}>
          재설정 링크 보내기
        </button>
      </form>

      <Link href="/auth/login" className={`${buttonStyles.ghost} mt-4 w-full`}>
        로그인으로 돌아가기
      </Link>
    </>
  );
}
