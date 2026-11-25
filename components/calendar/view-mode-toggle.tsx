import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import type { SubscriptionsView } from "@/lib/calendar/query";

export function ViewModeToggle({ view, year, month }: { view: SubscriptionsView; year: number; month: number }) {
  const items = [
    { value: "list" as const, label: "목록", href: "/subscriptions?view=list", icon: List },
    { value: "calendar" as const, label: "캘린더", href: `/subscriptions?view=calendar&year=${year}&month=${month}`, icon: CalendarDays },
  ];
  return (
    <nav aria-label="보기 방식" className="mb-4 grid grid-cols-2 rounded-xl bg-surface p-1 ring-1 ring-border">
      {items.map(({ value, label, href, icon: Icon }) => {
        const active = view === value;
        return (
          <Link
            key={value}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-body outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              active ? "bg-primary font-semibold text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label} 보기
          </Link>
        );
      })}
    </nav>
  );
}
