"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction, updatePasswordAction } from "@/lib/auth/actions";
import { IDLE } from "@/lib/form-state";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles } from "@/components/ui/styles";
import { TextField } from "./text-field";

export function RequestResetForm({ linkInvalid }: { linkInvalid: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordResetAction, IDLE);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <>
      <h1 className="text-title text-foreground">비밀번호 재설정</h1>
      <p className="mt-2 text-body text-muted-foreground">가입한 이메일로 재설정 링크를 보내 드려요.</p>
      <div className="mt-6 flex flex-col gap-4" aria-live="polite">
        {linkInvalid && state.status === "idle" ? (
          <FormMessage tone="error">재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해 주세요.</FormMessage>
        ) : null}
        {state.status === "error" && !fieldErrors ? <FormMessage tone="error">{state.message}</FormMessage> : null}
        {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      </div>
      <form action={action} className="mt-4 flex flex-col gap-4" noValidate>
        <TextField
          id="reset-email"
          name="email"
          type="email"
          label="이메일"
          autoComplete="email"
          disabled={pending}
          defaultValue={state.status === "error" ? state.email : undefined}
          error={fieldErrors?.email}
        />
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {pending ? <Spinner /> : null}
          {pending ? "요청을 전송하고 있어요..." : state.status === "success" ? "다시 보내기" : "재설정 링크 보내기"}
        </button>
      </form>
      <Link href="/auth/login" className={`${buttonStyles.ghost} mt-4 w-full`}>
        로그인으로 돌아가기
      </Link>
    </>
  );
}

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, IDLE);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <>
      <h1 className="text-title text-foreground">새 비밀번호 설정</h1>
      <p className="mt-2 text-body text-muted-foreground">앞으로 사용할 새 비밀번호를 입력해 주세요.</p>
      <div className="mt-6 flex flex-col gap-4" aria-live="polite">
        {state.status === "error" && !fieldErrors ? <FormMessage tone="error">{state.message}</FormMessage> : null}
        {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
      </div>
      {state.status === "success" ? (
        <Link href="/home" className={`${buttonStyles.primary} mt-4 w-full`}>
          홈으로 가기
        </Link>
      ) : (
        <form action={action} className="mt-4 flex flex-col gap-4" noValidate>
          <TextField
            id="new-password"
            name="password"
            type="password"
            label="새 비밀번호"
            autoComplete="new-password"
            hint="영문과 숫자를 포함해 8자 이상"
            disabled={pending}
            error={fieldErrors?.password}
          />
          <button type="submit" disabled={pending} className={buttonStyles.primary}>
            {pending ? <Spinner /> : null}
            {pending ? "저장하고 있어요..." : "비밀번호 저장"}
          </button>
        </form>
      )}
    </>
  );
}
