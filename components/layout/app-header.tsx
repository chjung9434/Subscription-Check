import Link from "next/link";
import { Settings } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-2">
      <Link
        href="/home"
        className="flex min-h-11 items-center rounded-xl px-2 text-section text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        구독체크
      </Link>
      <Link
        href="/settings/profile"
        aria-label="계정 및 설정"
        className="flex size-11 items-center justify-center rounded-xl text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Settings aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </Link>
    </header>
  );
}
