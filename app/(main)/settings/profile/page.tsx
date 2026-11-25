import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { buttonStyles, cardStyles } from "@/components/ui/styles";
import { signOutAction } from "@/lib/auth/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  return (
    <>
      <BackLink href="/home" label="홈으로" />
      <PageHeading title="계정 및 환경설정" />
      <div className="flex flex-col gap-4">
        <section className={cardStyles}>
          <h2 className="text-section text-foreground">계정</h2>
          <p className="mt-2 text-caption text-muted-foreground">로그인한 이메일</p>
          <p className="text-body break-all text-foreground">{data.user?.email ?? "이메일 정보 없음"}</p>
          <form action={signOutAction} className="mt-4">
            <button type="submit" className={`${buttonStyles.secondary} w-full`}>
              로그아웃
            </button>
          </form>
        </section>
        <DeleteAccountSection />
      </div>
    </>
  );
}
