import { z } from "zod";

const email = z.string().trim().pipe(z.email("올바른 이메일 주소를 입력해 주세요."));

const newPassword = z
  .string()
  .min(8, "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.")
  .max(72, "비밀번호는 72자 이하로 입력해 주세요.")
  .regex(/^(?=.*[A-Za-z])(?=.*\d)/, "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.");

export const SignUpInputSchema = z.object({ email, password: newPassword });
export const SignInInputSchema = z.object({ email, password: z.string().min(1, "비밀번호를 입력해 주세요.") });
export const PasswordResetRequestSchema = z.object({ email });
export const UpdatePasswordSchema = z.object({ password: newPassword });

export const OAUTH_PROVIDERS = ["google", "kakao", "naver"] as const;
export const OAuthProviderSchema = z.enum(OAUTH_PROVIDERS);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export const DELETE_ACCOUNT_CONFIRMATION = "구독체크 탈퇴";
export const DeleteAccountInputSchema = z.object({
  confirmationText: z.literal(DELETE_ACCOUNT_CONFIRMATION, {
    error: `정확한 확인 문구('${DELETE_ACCOUNT_CONFIRMATION}')를 입력해 주세요.`,
  }),
});
