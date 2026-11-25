import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";

/** 메인 서비스 셸: 상단 헤더 + 본문 + 하단 3탭. 넓은 화면에서는 480px 모바일 컨테이너로 중앙 정렬. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background md:border-x md:border-border md:shadow-sm">
      <AppHeader />
      <main className="flex-1 px-4 pt-6 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
