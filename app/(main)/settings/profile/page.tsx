import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { LogoutButton } from "@/components/settings/logout-button";
import { NotificationPreferenceForm } from "@/components/settings/notification-preference-form";
import { PasswordSection } from "@/components/settings/password-section";
import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { cardStyles } from "@/components/ui/styles";
import { getAccountSettings, type LoginProvider } from "@/lib/data/account";

const PROVIDER_LABELS: Record<LoginProvider, string> = { email: "이메일", kakao: "카카오", naver: "네이버", google: "구글" };

export default async function ProfileSettingsPage() {
  const settings = await getAccountSettings();
  const providerLabel = PROVIDER_LABELS[settings.user.provider];

  return (
    <>
      <BackLink href="/home" label="홈으로" />
      <PageHeading title="설정 및 계정 관리" />
      <div className="flex flex-col gap-4">
        <section className={cardStyles} aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="text-section text-foreground">
            계정
          </h2>
          <p className="mt-2 text-caption text-muted-foreground">로그인한 이메일</p>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-body break-all text-foreground">{settings.user.email || "이메일 정보 없음"}</p>
            <span className="rounded-xl bg-neutral-subtle px-2 py-1 text-caption font-semibold text-neutral-foreground">{providerLabel} 로그인</span>
          </div>
        </section>

        <NotificationPreferenceForm initial={settings.notificationPreference} />
        <PasswordSection hasPassword={settings.user.hasPassword} providerLabel={providerLabel} />

        <section className={cardStyles} aria-label="로그아웃">
          <LogoutButton />
        </section>
        <DeleteAccountSection />
      </div>
    </>
  );
}
