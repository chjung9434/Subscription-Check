import { describe, expect, it } from "vitest";
import { isOAuthProviderReady } from "@/lib/auth/oauth-config";
import { safeRedirectPath } from "@/lib/auth/redirect";
import {
  DeleteAccountInputSchema,
  OAuthProviderSchema,
  SignInInputSchema,
  SignUpInputSchema,
  UpdatePasswordSchema,
} from "@/lib/validations/auth";

const firstError = (result: { success: boolean; error?: { issues: { message: string }[] } }) => result.error?.issues[0]?.message;

describe("SignUpInputSchema", () => {
  it("accepts a valid email and a password with letters and digits", () => {
    expect(SignUpInputSchema.safeParse({ email: " user@example.com ", password: "abcd1234" })).toMatchObject({
      success: true,
      data: { email: "user@example.com" },
    });
  });

  it("explains an invalid email in Korean", () => {
    expect(firstError(SignUpInputSchema.safeParse({ email: "not-an-email", password: "abcd1234" }))).toBe("올바른 이메일 주소를 입력해 주세요.");
  });

  it.each(["abc123", "abcdefgh", "12345678"])("rejects weak password %s", (password) => {
    expect(firstError(SignUpInputSchema.safeParse({ email: "user@example.com", password }))).toBe(
      "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.",
    );
  });
});

describe("other auth schemas", () => {
  it("requires a password to sign in but not a strong one", () => {
    expect(SignInInputSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
    expect(SignInInputSchema.safeParse({ email: "user@example.com", password: "x" }).success).toBe(true);
  });

  it("applies the password rule to a new password", () => {
    expect(UpdatePasswordSchema.safeParse({ password: "short1" }).success).toBe(false);
  });

  it("accepts only supported providers", () => {
    expect(OAuthProviderSchema.safeParse("kakao").success).toBe(true);
    expect(OAuthProviderSchema.safeParse("facebook").success).toBe(false);
  });

  it("requires the exact deletion confirmation text", () => {
    expect(DeleteAccountInputSchema.safeParse({ confirmationText: "구독체크 탈퇴" }).success).toBe(true);
    expect(firstError(DeleteAccountInputSchema.safeParse({ confirmationText: "탈퇴" }))).toBe("정확한 확인 문구('구독체크 탈퇴')를 입력해 주세요.");
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/subscriptions/abc?tab=calendar", "/subscriptions/abc?tab=calendar"],
    [undefined, "/home"],
    ["", "/home"],
    ["https://evil.example", "/home"],
    ["//evil.example", "/home"],
    ["/\\evil.example", "/home"],
    ["javascript:alert(1)", "/home"],
    ["/home\nSet-Cookie:x", "/home"],
  ])("%s -> %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });
});

describe("isOAuthProviderReady", () => {
  const env = { GOOGLE_CLIENT_ID: "id", GOOGLE_CLIENT_SECRET: "secret", KAKAO_CLIENT_ID: "id", NAVER_CLIENT_ID: "id", NAVER_CLIENT_SECRET: "secret" };

  it("is ready only when both keys are set", () => {
    expect(isOAuthProviderReady("google", env)).toBe(true);
    expect(isOAuthProviderReady("kakao", env)).toBe(false);
  });

  it("treats Naver as not ready because Supabase Auth has no Naver provider", () => {
    expect(isOAuthProviderReady("naver", env)).toBe(false);
  });
});
