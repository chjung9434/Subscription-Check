"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";
import { buttonStyles } from "@/components/ui/styles";
import { formatDayTotals, type CalendarDaySummary, type MonthlyCalendarProjection } from "@/lib/calendar/calendar-utils";
import { formatAmount, formatDate } from "@/lib/format";
import { CYCLE_LABELS } from "@/lib/subscriptions/labels";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const KEY_STEP: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

function dayLabel(day: CalendarDaySummary) {
  const [, month, date] = day.date.split("-").map(Number);
  const parts = [`${month}월 ${date}일`];
  if (day.isToday) parts.push("오늘");
  parts.push(day.items.length > 0 ? `결제 ${day.items.length}건 ${formatDayTotals(day)}` : "결제 없음");
  if (day.hasOverdue) parts.push("결제 확인 필요");
  return parts.join(", ");
}

export function CalendarView({ projection, initialSelectedDate }: { projection: MonthlyCalendarProjection; initialSelectedDate: string }) {
  const [selected, setSelected] = useState(initialSelectedDate);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const monthDays = projection.days.filter((day) => day.isCurrentMonth);
  const selectedDay = monthDays.find((day) => day.date === selected) ?? monthDays[0];
  const monthHasItems = monthDays.some((day) => day.items.length > 0);

  const select = (date: string, focus = false) => {
    setSelected(date);
    const params = new URLSearchParams(window.location.search);
    params.set("selectedDate", date);
    window.history.replaceState(null, "", `?${params.toString()}`);
    if (focus) buttons.current.get(date)?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = KEY_STEP[event.key];
    if (step === undefined) return;
    const target = monthDays[index + step];
    if (!target) return;
    event.preventDefault();
    select(target.date, true);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 모바일에서는 좌우 여백까지 써서 7칸이 각각 44px 이상이 되게 한다 */}
      <div className="-mx-4 border-y border-border bg-surface sm:mx-0 sm:rounded-xl sm:border">
        <div className="grid grid-cols-7 border-b border-border" aria-hidden="true">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} className="py-2 text-center text-caption text-muted-foreground">
              {weekday}
            </span>
          ))}
        </div>
        <div role="group" aria-label={`${projection.year}년 ${projection.month}월 결제 달력`} className="grid grid-cols-7">
          {projection.days.map((day) => {
            if (!day.isCurrentMonth) {
              return (
                <span key={day.date} aria-hidden="true" className="flex min-h-14 justify-center pt-2 text-caption text-muted-foreground">
                  {day.dayNumber}
                </span>
              );
            }
            const index = monthDays.indexOf(day);
            const isSelected = day.date === selectedDay?.date;
            const hasKrw = day.items.some((item) => item.currency === "KRW");
            const hasUsd = day.items.some((item) => item.currency === "USD");
            return (
              <button
                key={day.date}
                ref={(element) => {
                  if (element) buttons.current.set(day.date, element);
                  else buttons.current.delete(day.date);
                }}
                type="button"
                tabIndex={isSelected ? 0 : -1}
                aria-pressed={isSelected}
                aria-label={dayLabel(day)}
                onClick={() => select(day.date)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={`flex min-h-14 min-w-11 flex-col items-center gap-1 pt-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                  isSelected ? "bg-primary-subtle" : ""
                }`}
              >
                <span
                  className={`flex size-7 items-center justify-center rounded-full text-caption ${
                    day.isToday ? "bg-primary font-bold text-primary-foreground" : isSelected ? "font-bold text-primary" : "text-foreground"
                  }`}
                >
                  {day.dayNumber}
                </span>
                {day.items.length > 0 ? (
                  <span className="flex items-center gap-0.5" aria-hidden="true">
                    {hasKrw ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                    {hasUsd ? <span className="size-1.5 rounded-full bg-foreground" /> : null}
                    {day.hasOverdue ? <span className="size-1.5 rounded-full bg-status-warning" /> : null}
                    {day.items.length > 1 ? <span className="text-caption leading-none font-semibold text-muted-foreground">{day.items.length}</span> : null}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border px-4 py-2 text-caption text-muted-foreground">
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
            원화 결제
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
            달러 결제
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-status-warning" />
            결제 확인 필요
          </span>
        </p>
      </div>

      <section aria-live="polite" aria-labelledby="day-detail-heading" className="flex flex-col gap-3">
        {!monthHasItems ? (
          <p id="day-detail-heading" className="rounded-xl border border-border bg-surface p-4 text-body text-muted-foreground">
            이번 달 결제 예정인 구독이 없습니다.
          </p>
        ) : selectedDay && selectedDay.items.length > 0 ? (
          <>
            <div>
              <h2 id="day-detail-heading" className="text-section text-foreground">
                {formatDate(selectedDay.date)} 결제 예정 (총 {selectedDay.items.length}건)
              </h2>
              <p className="mt-1 text-body font-semibold text-foreground">{formatDayTotals(selectedDay)}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {selectedDay.items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/subscriptions/${item.id}`}
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-body font-bold text-primary">
                      {item.serviceName.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1">
                        <span className="text-body font-semibold text-foreground">{item.serviceName}</span>
                        <span className="rounded-xl bg-neutral-subtle px-2 py-0.5 text-caption text-neutral-foreground">{CYCLE_LABELS[item.billingCycle]}</span>
                        {item.isOverdue ? (
                          <span className="rounded-xl bg-status-warning-subtle px-2 py-0.5 text-caption font-semibold text-status-warning-foreground">결제 확인 필요</span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-caption text-muted-foreground">{item.paymentMethodMemo ?? "결제 수단 미지정"}</span>
                    </span>
                    <span className="shrink-0 text-body font-bold text-foreground">{formatAmount(item.amount, item.currency)}</span>
                    <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4">
            <p id="day-detail-heading" className="text-body text-muted-foreground">
              {selectedDay ? `${formatDate(selectedDay.date)} — ` : ""}선택한 날짜에 예정된 결제가 없습니다.
            </p>
            <Link href="/subscriptions/new" className={buttonStyles.secondary}>
              <Plus aria-hidden="true" className="size-4" />새 구독 등록
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
