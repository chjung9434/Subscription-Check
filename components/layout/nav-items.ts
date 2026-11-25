import { Bell, House, ListChecks, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/home", label: "홈", icon: House },
  { href: "/subscriptions", label: "구독", icon: ListChecks },
  { href: "/notifications", label: "알림", icon: Bell },
];

/** 현재 경로가 탭 경로이거나 그 하위 경로이면 활성 탭으로 본다. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
