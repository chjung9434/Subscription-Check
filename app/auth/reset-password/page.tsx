import { RequestResetForm, UpdatePasswordForm } from "@/components/auth/reset-password-forms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** 로그인 상태(재설정 메일 링크로 들어온 경우 포함)면 새 비밀번호 입력, 아니면 재설정 메일 요청 */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ error }, supabase] = await Promise.all([searchParams, createSupabaseServerClient()]);
  const { data } = await supabase.auth.getUser();

  return data.user ? <UpdatePasswordForm /> : <RequestResetForm linkInvalid={error === "invalid_link"} />;
}
