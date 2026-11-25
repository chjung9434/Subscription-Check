import { BackLink } from "@/components/ui/back-link";
import { PageHeading } from "@/components/ui/page-heading";
import { PlaceholderCard } from "@/components/ui/placeholder-card";
import { buttonStyles } from "@/components/ui/styles";

export default function ProfileSettingsPage() {
  return (
    <>
      <BackLink href="/home" label="홈으로" />
      <PageHeading title="계정 및 환경설정" />
      <div className="flex flex-col gap-4">
        <PlaceholderCard title="프로필">
          <p>계정 정보, 비밀번호 변경, 회원 탈퇴 메뉴가 이곳에 들어갈 예정이에요.</p>
        </PlaceholderCard>
        <button type="button" disabled aria-describedby="logout-note" className={buttonStyles.secondary}>
          로그아웃
        </button>
        <p id="logout-note" className="text-caption text-muted-foreground">
          로그인 기능이 준비되면 로그아웃할 수 있어요.
        </p>
      </div>
    </>
  );
}
