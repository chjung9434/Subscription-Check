import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/auth/redirect";

const NOTICES: Record<string, { tone: "error" | "success"; text: string }> = {
  deleted: { tone: "success", text: "탈퇴가 완료되어 모든 데이터가 삭제되었어요." },
  missing_code: { tone: "error", text: "로그인을 완료하지 못했어요. 다시 시도해 주세요." },
  callback_failed: { tone: "error", text: "로그인을 완료하지 못했어요. 다시 시도해 주세요." },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const key = [params.status, params.error].find((value): value is string => typeof value === "string" && value in NOTICES);

  return <LoginForm returnUrl={safeRedirectPath(params.returnUrl)} notice={key ? NOTICES[key] : undefined} />;
}
