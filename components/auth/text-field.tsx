import { FieldError } from "@/components/ui/form-message";
import { inputStyles } from "@/components/ui/styles";

export function TextField({
  id,
  name,
  label,
  type,
  autoComplete,
  error,
  hint,
  disabled,
  defaultValue,
  value,
  onChange,
}: {
  id: string;
  name: string;
  label: string;
  type: "email" | "password" | "text";
  autoComplete: string;
  error?: string;
  hint?: string;
  disabled?: boolean;
  defaultValue?: string;
  /** 지정하면 제어 컴포넌트가 된다 (폼 액션 후에도 값 유지) */
  value?: string;
  onChange?: (value: string) => void;
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-caption font-semibold text-foreground">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputStyles} ${error ? "border-status-danger" : ""}`}
      />
      {hint ? (
        <p id={`${id}-hint`} className="text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
