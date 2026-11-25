import Link from "next/link";
import type { ReactNode } from "react";

/** 인증 전용 셸: 헤더·하단 탭 없이 중앙 카드만 표시 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-8">
      <Link
        href="/home"
        className="mx-auto mb-6 flex min-h-11 items-center rounded-xl px-2 text-title text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        구독체크
      </Link>
      <main className="rounded-xl border border-border bg-surface p-6">{children}</main>
    </div>
  );
}
