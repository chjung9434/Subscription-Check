"use server";

import { redirect } from "next/navigation";
import type { z } from "zod";
import { isOAuthProviderReady } from "@/lib/auth/oauth-config";
import type { FormState, FieldErrors } from "@/lib/form-state";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePublicEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DeleteAccountInputSchema,
  OAuthProviderSchema,
  PasswordResetRequestSchema,
  SignInInputSchema,
  SignUpInputSchema,
  UpdatePasswordSchema,
} from "@/lib/validations/auth";

const GENERIC_ERROR = "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.";

const text = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
};

function validationError(error: z.ZodError): FormState {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return { status: "error", code: "VALIDATION_ERROR", message: "입력한 내용을 확인해 주세요.", fieldErrors };
}

function unexpected(operation: string, error: { code?: string; status?: number; name?: string }): FormState {
  console.error(`[auth] ${operation} failed`, { name: error.name, code: error.code, status: error.status });
  return { status: "error", code: "UNEXPECTED", message: GENERIC_ERROR };
}

const callbackUrl = (next: string) => {
  const url = new URL("/auth/callback", requirePublicEnv("NEXT_PUBLIC_APP_URL"));
  url.searchParams.set("next", next);
  return url.toString();
};

const withEmail = (state: FormState, formData: FormData): FormState =>
  state.status === "error" ? { ...state, email: text(formData, "email") } : state;

export async function signUpWithEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return withEmail(await signUp(formData), formData);
}

async function signUp(formData: FormData): Promise<FormState> {
  const parsed = SignUpInputSchema.safeParse({ email: text(formData, "email"), password: text(formData, "password") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: callbackUrl("/home") },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { status: "error", code: "USER_ALREADY_EXISTS", message: "이미 가입된 이메일 주소예요. 로그인해 주세요." };
    }
    if (error.code === "weak_password") {
      return { status: "error", code: "WEAK_PASSWORD", message: "더 안전한 비밀번호를 사용해 주세요.", fieldErrors: { password: "더 안전한 비밀번호를 사용해 주세요." } };
    }
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { status: "error", code: "RATE_LIMITED", message: "요청이 많아요. 잠시 후 다시 시도해 주세요." };
    }
    return unexpected("signUp", error);
  }

  // 이메일 확인이 켜진 환경에서 이미 가입된 주소는 identities가 빈 사용자로 돌아온다
  if (data.user && data.user.identities?.length === 0) {
    return { status: "error", code: "USER_ALREADY_EXISTS", message: "이미 가입된 이메일 주소예요. 로그인해 주세요." };
  }

  if (!data.session) {
    return { status: "success", message: "가입 확인 메일을 보냈어요. 메일의 링크를 눌러 가입을 완료해 주세요." };
  }

  redirect(safeRedirectPath(text(formData, "returnUrl")));
}

export async function signInWithEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return withEmail(await signIn(formData), formData);
}

async function signIn(formData: FormData): Promise<FormState> {
  const parsed = SignInInputSchema.safeParse({ email: text(formData, "email"), password: text(formData, "password") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "invalid_credentials") {
      return { status: "error", code: "INVALID_CREDENTIALS", message: "이메일 또는 비밀번호가 일치하지 않습니다." };
    }
    if (error.code === "email_not_confirmed") {
      return { status: "error", code: "EMAIL_NOT_CONFIRMED", message: "가입 확인 메일의 링크를 먼저 눌러 주세요." };
    }
    if (error.code === "over_request_rate_limit") {
      return { status: "error", code: "RATE_LIMITED", message: "요청이 많아요. 잠시 후 다시 시도해 주세요." };
    }
    return unexpected("signInWithPassword", error);
  }

  redirect(safeRedirectPath(text(formData, "returnUrl")));
}

export async function signInWithOAuthAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = OAuthProviderSchema.safeParse(text(formData, "provider"));
  if (!parsed.success) return { status: "error", code: "VALIDATION_ERROR", message: "지원하지 않는 로그인 방식이에요." };

  const provider = parsed.data;
  if (provider === "naver" || !isOAuthProviderReady(provider)) {
    return {
      status: "error",
      code: "OAUTH_NOT_CONFIGURED",
      message: "해당 소셜 로그인은 환경 설정이 완료되지 않았습니다. 이메일 로그인을 이용해 주세요.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: callbackUrl(safeRedirectPath(text(formData, "returnUrl"))) },
  });
  if (error || !data.url) {
    return unexpected("signInWithOAuth", error ?? { name: "MissingAuthorizeUrl" });
  }

  redirect(data.url);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth] signOut failed", { code: error.code, status: error.status });
    throw new Error("로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
  redirect("/auth/login");
}

export async function requestPasswordResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  return withEmail(await requestPasswordReset(formData), formData);
}

async function requestPasswordReset(formData: FormData): Promise<FormState> {
  const parsed = PasswordResetRequestSchema.safeParse({ email: text(formData, "email") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl("/auth/reset-password"),
  });
  if (error) {
    if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
      return { status: "error", code: "RATE_LIMITED", message: "요청이 많아요. 잠시 후 다시 시도해 주세요." };
    }
    console.error("[auth] resetPasswordForEmail failed", { code: error.code, status: error.status });
    return { status: "error", code: "RESET_EMAIL_FAILED", message: "재설정 메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요." };
  }

  // 가입 여부를 드러내지 않도록 항상 같은 안내
  return { status: "success", message: "비밀번호 재설정 메일이 발송되었습니다. 메일함을 확인해 주세요." };
}

export async function updatePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = UpdatePasswordSchema.safeParse({ password: text(formData, "password") });
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { status: "error", code: "UNAUTHORIZED", message: "재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해 주세요." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { status: "error", code: "SAME_PASSWORD", message: "이전과 다른 비밀번호를 입력해 주세요.", fieldErrors: { password: "이전과 다른 비밀번호를 입력해 주세요." } };
    }
    if (error.code === "weak_password") {
      return { status: "error", code: "WEAK_PASSWORD", message: "더 안전한 비밀번호를 사용해 주세요.", fieldErrors: { password: "더 안전한 비밀번호를 사용해 주세요." } };
    }
    return unexpected("updateUser(password)", error);
  }

  return { status: "success", message: "비밀번호를 변경했어요. 새 비밀번호로 계속 이용할 수 있어요." };
}

export async function deleteAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return { status: "error", code: "UNAUTHORIZED", message: "로그인이 필요해요. 다시 로그인해 주세요." };
  }

  const parsed = DeleteAccountInputSchema.safeParse({ confirmationText: text(formData, "confirmationText") });
  if (!parsed.success) return validationError(parsed.error);

  // 확인된 본인 계정만 삭제. auth.users 삭제가 FK cascade로 profiles·구독·알림 설정·스케줄·로그를 함께 지운다.
  const { error } = await createSupabaseAdminClient().auth.admin.deleteUser(auth.user.id);
  if (error) {
    console.error("[auth] deleteUser failed", { code: error.code, status: error.status });
    return { status: "error", code: "DELETE_FAILED", message: "회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." };
  }

  // 사용자는 이미 삭제됨: 이 기기의 세션 쿠키만 지운다 (서버 401/404 응답은 auth-js가 무시하고 로컬 세션을 정리)
  const signOut = await supabase.auth.signOut({ scope: "local" });
  if (signOut.error) {
    console.error("[auth] local signOut after deletion failed", { code: signOut.error.code, status: signOut.error.status });
  }
  redirect("/auth/login?status=deleted");
}

