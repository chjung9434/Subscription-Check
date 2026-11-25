"use client";

import { FieldError } from "./form-message";

/** 라디오 그룹 기반 세그먼트 선택 (키보드 화살표 이동은 브라우저 기본 동작) */
export function SegmentedControl<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  disabled,
  error,
}: {
  name: string;
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1" aria-describedby={error ? `${name}-error` : undefined}>
      <legend className="mb-1 text-caption font-semibold text-foreground">{legend}</legend>
      <div className={`grid rounded-xl bg-background p-1 ${options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-xl px-1 text-center text-body text-muted-foreground has-checked:bg-surface has-checked:font-semibold has-checked:text-primary has-checked:shadow-sm has-focus-visible:ring-2 has-focus-visible:ring-primary has-disabled:cursor-not-allowed"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError id={`${name}-error`} message={error} />
    </fieldset>
  );
}
