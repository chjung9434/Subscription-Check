"use client";

import { useState, useTransition } from "react";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, cardStyles, inputStyles } from "@/components/ui/styles";
import { updateNotificationPreferencesAction } from "@/app/(main)/settings/profile/actions";
import type { FormState } from "@/lib/form-state";
import { DISPATCH_TIME_OPTIONS } from "@/lib/validations/settings";

const DAY_OPTIONS = [1, 3, 7] as const;
type Day = (typeof DAY_OPTIONS)[number];

const timeLabel = (time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  return `${hours < 12 ? "오전" : "오후"} ${hours % 12 === 0 ? 12 : hours % 12}:${String(minutes).padStart(2, "0")}`;
};

export function NotificationPreferenceForm({ initial }: { initial: { isEnabled: boolean; remindDays: number[]; dispatchTime: string } }) {
  const [isEnabled, setIsEnabled] = useState(initial.isEnabled);
  const [days, setDays] = useState<Day[]>(initial.remindDays.filter((day): day is Day => day === 1 || day === 3 || day === 7));
  const [dispatchTime, setDispatchTime] = useState(initial.dispatchTime);
  const [result, setResult] = useState<FormState | null>(null);
  const [pending, startTransition] = useTransition();
  const errors = result?.status === "error" ? result.fieldErrors : undefined;
  const timeOptions = DISPATCH_TIME_OPTIONS.includes(dispatchTime) ? DISPATCH_TIME_OPTIONS : [...DISPATCH_TIME_OPTIONS, dispatchTime].sort();

  const toggleDay = (day: Day) => setDays((prev) => (prev.includes(day) ? prev.filter((value) => value !== day) : [...prev, day].sort((a, b) => a - b)));

  const save = () => {
    if (days.length === 0) {
      setResult({ status: "error", code: "VALIDATION_ERROR", message: "입력한 내용을 확인해 주세요.", fieldErrors: { remindDays: "최소 1개 이상의 알림 시점을 선택해야 합니다." } });
      return;
    }
    setResult(null);
    startTransition(async () => {
      try {
        setResult(await updateNotificationPreferencesAction({ isEnabled, remindDays: days, dispatchTime }));
      } catch {
        setResult({ status: "error", code: "NETWORK", message: "설정을 저장하지 못했어요. 다시 시도해 주세요." });
      }
    });
  };

  return (
    <section className={cardStyles} aria-labelledby="pref-heading">
      <div className="flex items-center justify-between gap-3">
        <h2 id="pref-heading" className="text-section text-foreground">
          기본 결제 사전 알림
        </h2>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-body text-foreground">
          <span className="sr-only">결제 사전 알림 받기</span>
          <span aria-hidden="true">{isEnabled ? "켜짐" : "꺼짐"}</span>
          <input
            type="checkbox"
            role="switch"
            checked={isEnabled}
            onChange={(event) => setIsEnabled(event.target.checked)}
            disabled={pending}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="relative h-7 w-12 rounded-full bg-border-strong transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-surface after:transition-transform peer-checked:after:translate-x-5 motion-reduce:after:transition-none"
          />
        </label>
      </div>
      <p className="mt-1 text-caption text-muted-foreground">개별 알림을 따로 정하지 않은 모든 구독에 적용돼요.</p>

      <fieldset className="mt-4" disabled={pending || !isEnabled} aria-describedby={errors?.remindDays ? "remindDays-error" : undefined}>
        <legend className="mb-2 text-caption font-semibold text-foreground">알림 시점 (여러 개 선택 가능)</legend>
        <div className="grid grid-cols-3 gap-2">
          {DAY_OPTIONS.map((day) => (
            <label
              key={day}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-border-strong text-body text-foreground has-checked:border-primary has-checked:bg-primary-subtle has-checked:font-semibold has-checked:text-primary has-focus-visible:ring-2 has-focus-visible:ring-primary has-disabled:cursor-not-allowed has-disabled:opacity-60"
            >
              <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} className="sr-only" />
              {day}일 전
            </label>
          ))}
        </div>
        <FieldError id="remindDays-error" message={errors?.remindDays} />
      </fieldset>

      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="dispatch-time" className="text-caption font-semibold text-foreground">
          알림 받을 시각 (한국 시간)
        </label>
        <select
          id="dispatch-time"
          value={dispatchTime}
          onChange={(event) => setDispatchTime(event.target.value)}
          disabled={pending || !isEnabled}
          className={inputStyles}
        >
          {timeOptions.map((time) => (
            <option key={time} value={time}>
              {timeLabel(time)}
            </option>
          ))}
        </select>
        <FieldError id="dispatchTime-error" message={errors?.dispatchTime} />
      </div>

      <div className="mt-4 flex flex-col gap-3" aria-live="polite">
        {result?.status === "success" ? <FormMessage tone="success">{result.message}</FormMessage> : null}
        {result?.status === "error" && !errors ? <FormMessage tone="error">{result.message}</FormMessage> : null}
        <button type="button" onClick={save} disabled={pending} className={`${buttonStyles.primary} w-full`}>
          {pending ? <Spinner /> : null}
          {pending ? "저장하고 있어요..." : "설정 저장"}
        </button>
      </div>
    </section>
  );
}
