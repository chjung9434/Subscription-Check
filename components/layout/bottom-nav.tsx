"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath } from "./nav-items";

/** 구독 등록·상세·수정 같은 하위 작업 화면에서는 탭 바를 숨겨 작업에 집중하게 한다 (뒤로가기 링크 제공). */
const HIDDEN_ON = /^\/subscriptions\/.+/;

export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.test(pathname)) return null;

  return (
    <nav
      aria-label="주요 메뉴"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-15 flex-col items-center justify-center gap-1 text-caption outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                  active ? "bg-primary-subtle font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon aria-hidden="true" className="size-6" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
