"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/auth/text-field";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { changePasswordAction } from "@/app/(main)/settings/profile/actions";
import { IDLE } from "@/lib/form-state";

export function PasswordSection({ hasPassword, providerLabel }: { hasPassword: boolean; providerLabel: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(changePasswordAction, IDLE);
  const errors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <section className={cardStyles} aria-labelledby="password-heading">
      <h2 id="password-heading" className="text-section text-foreground">
        비밀번호
      </h2>
      {!hasPassword ? (
        <p className="mt-2 text-body text-muted-foreground">{providerLabel} 간편 로그인으로 가입된 계정입니다. 비밀번호는 {providerLabel}에서 관리해 주세요.</p>
      ) : !open ? (
        <button type="button" onClick={() => setOpen(true)} aria-expanded={false} className={`${buttonStyles.secondary} mt-3 w-full`}>
          비밀번호 변경
        </button>
      ) : (
        <form action={action} className="mt-3 flex flex-col gap-4" noValidate>
          <div aria-live="polite">
            {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
            {state.status === "error" && !errors ? <FormMessage tone="error">{state.message}</FormMessage> : null}
          </div>
          <TextField id="currentPassword" name="currentPassword" type="password" label="현재 비밀번호" autoComplete="current-password" disabled={pending} error={errors?.currentPassword} />
          <TextField
            id="newPassword"
            name="newPassword"
            type="password"
            label="새 비밀번호"
            autoComplete="new-password"
            hint="영문과 숫자를 포함해 8자 이상"
            disabled={pending}
            error={errors?.newPassword}
          />
          <TextField id="confirmPassword" name="confirmPassword" type="password" label="새 비밀번호 확인" autoComplete="new-password" disabled={pending} error={errors?.confirmPassword} />
          <button type="submit" disabled={pending} className={buttonStyles.primary}>
            {pending ? <Spinner /> : null}
            {pending ? "변경하고 있어요..." : "비밀번호 변경"}
          </button>
        </form>
      )}
    </section>
  );
}
