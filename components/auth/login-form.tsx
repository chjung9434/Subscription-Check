"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signInWithEmailAction, signInWithOAuthAction, signUpWithEmailAction } from "@/lib/auth/actions";
import { IDLE, type AuthFormState } from "@/lib/auth/form-state";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, kakaoButtonStyles } from "@/components/ui/styles";
import { TextField } from "./text-field";

type Mode = "signin" | "signup";

export function LoginForm({ returnUrl, notice }: { returnUrl: string; notice?: { tone: "error" | "success"; text: string } }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signIn, signingIn] = useActionState(signInWithEmailAction, IDLE);
  const [signUpState, signUp, signingUp] = useActionState(signUpWithEmailAction, IDLE);
  const [oauthState, oauth, oauthPending] = useActionState(signInWithOAuthAction, IDLE);
  // 제출마다 새 결과 객체가 오므로, 닫은 결과와 같으면 숨기고 새 결과면 다시 연다
  const [dismissedGuide, setDismissedGuide] = useState<AuthFormState | null>(null);
  const guideOpen = oauthState.status === "error" && oauthState.code === "OAUTH_NOT_CONFIGURED" && dismissedGuide !== oauthState;

  const state = mode === "signin" ? signInState : signUpState;
  const pending = signingIn || signingUp || oauthPending;
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;
  const formError = state.status === "error" && !fieldErrors ? state.message : undefined;
  const oauthError = oauthState.status === "error" && oauthState.code !== "OAUTH_NOT_CONFIGURED" ? oauthState.message : undefined;

  return (
    <>
      <h1 className="text-title text-foreground">구독체크 {mode === "signin" ? "로그인" : "회원가입"}</h1>
      <p className="mt-1 text-body text-muted-foreground">흩어진 구독 결제일을 한곳에서 관리하세요.</p>

      <div className="mt-6 grid grid-cols-2 rounded-xl bg-background p-1" role="group" aria-label="로그인 또는 회원가입 선택">
        {(["signin", "signup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mode === value}
            disabled={pending}
            onClick={() => setMode(value)}
            className={`min-h-11 rounded-xl text-body font-semibold outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {value === "signin" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-4" aria-live="polite">
        {notice && state.status === "idle" ? <FormMessage tone={notice.tone}>{notice.text}</FormMessage> : null}
        {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
        {state.status === "success" ? <FormMessage tone="success">{state.message}</FormMessage> : null}
        {oauthError ? <FormMessage tone="error">{oauthError}</FormMessage> : null}
      </div>

      <form
        key={mode}
        action={mode === "signin" ? signIn : signUp}
        className="mt-4 flex flex-col gap-4"
        noValidate
      >
        <input type="hidden" name="returnUrl" value={returnUrl} />
        <TextField
          id="email"
          name="email"
          type="email"
          label="이메일"
          autoComplete="email"
          disabled={pending}
          defaultValue={state.status === "error" ? state.email : undefined}
          error={fieldErrors?.email}
        />
        <TextField
          id="password"
          name="password"
          type="password"
          label="비밀번호"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          hint={mode === "signup" ? "영문과 숫자를 포함해 8자 이상" : undefined}
          disabled={pending}
          error={fieldErrors?.password}
        />
        <button type="submit" disabled={pending} className={buttonStyles.primary}>
          {signingIn || signingUp ? <Spinner /> : null}
          {mode === "signin" ? (signingIn ? "로그인 중..." : "로그인") : signingUp ? "가입 처리 중..." : "회원가입"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-caption text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는 간편 로그인
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={oauth} className="flex flex-col gap-3">
        <input type="hidden" name="returnUrl" value={returnUrl} />
        <button type="submit" name="provider" value="kakao" disabled={pending} className={kakaoButtonStyles}>
          카카오로 계속하기
        </button>
        <button type="submit" name="provider" value="naver" disabled={pending} className={buttonStyles.secondary}>
          <span aria-hidden="true" className="flex size-5 items-center justify-center rounded-sm bg-naver text-caption font-bold text-primary-foreground">
            N
          </span>
          네이버로 계속하기
        </button>
        <button type="submit" name="provider" value="google" disabled={pending} className={buttonStyles.secondary}>
          Google로 계속하기
        </button>
      </form>

      {mode === "signin" ? (
        <Link href="/auth/reset-password" className={`${buttonStyles.ghost} mt-4 w-full`}>
          비밀번호를 잊으셨나요?
        </Link>
      ) : null}

      <Dialog open={guideOpen} onClose={() => setDismissedGuide(oauthState)} title="소셜 로그인 설정 준비 중">
        <p className="text-body text-muted-foreground">해당 소셜 로그인은 환경 설정이 완료되지 않았습니다. 이메일 로그인을 이용해 주세요.</p>
        <form method="dialog" className="mt-6">
          <button type="submit" className={`${buttonStyles.primary} w-full`} autoFocus>
            확인
          </button>
        </form>
      </Dialog>
    </>
  );
}
