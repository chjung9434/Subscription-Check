"use client";

import { useActionState, useState } from "react";
import { TextField } from "@/components/auth/text-field";
import { PresetCatalogGrid } from "./preset-catalog-grid";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, inputStyles } from "@/components/ui/styles";
import type { GetPresetsResult, PresetSummaryItem } from "@/lib/presets/types";
import { IDLE, type FormState } from "@/lib/form-state";
import { CATEGORY_OPTIONS, CURRENCY_LABELS, CYCLE_LABELS, STATUS_LABELS } from "@/lib/subscriptions/labels";
import { BILLING_CYCLES, CURRENCY_CODES, SUBSCRIPTION_STATUSES, type BillingCycleType, type CurrencyCode, type SubscriptionStatus } from "@/types/database";

export interface SubscriptionFormValues {
  presetId: string | null;
  serviceName: string;
  category: string;
  amount: string;
  currency: CurrencyCode;
  billingCycle: BillingCycleType;
  nextBillingDate: string;
  paymentMethodMemo: string;
  memo: string;
  status: SubscriptionStatus;
}

export const EMPTY_FORM: SubscriptionFormValues = {
  presetId: null,
  serviceName: "",
  category: "",
  amount: "",
  currency: "KRW",
  billingCycle: "MONTHLY",
  nextBillingDate: "",
  paymentMethodMemo: "",
  memo: "",
  status: "ACTIVE",
};

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: SubscriptionFormValues;
  submitLabel: string;
  subscriptionId?: string;
  presets?: GetPresetsResult;
};

export function SubscriptionForm({ action, initial, submitLabel, subscriptionId, presets }: Props) {
  const [values, setValues] = useState(initial);
  const [state, formAction, pending] = useActionState(action, IDLE);
  const errors = state.status === "error" ? state.fieldErrors : undefined;
  const set = <K extends keyof SubscriptionFormValues>(key: K, value: SubscriptionFormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (preset: PresetSummaryItem | null, serviceName?: string) => {
    setValues((prev) =>
      preset
        ? {
            ...prev,
            presetId: preset.id,
            serviceName: preset.serviceName,
            category: preset.category,
            amount: String(preset.defaultAmount),
            currency: preset.defaultCurrency,
            billingCycle: preset.defaultBillingCycle,
          }
        : { ...prev, presetId: null, serviceName: serviceName ?? "", category: "", amount: "", currency: "KRW", billingCycle: "MONTHLY" },
    );
    if (!preset && serviceName) document.getElementById("service_name")?.focus();
  };

  const categories: readonly string[] = CATEGORY_OPTIONS.includes(values.category as (typeof CATEGORY_OPTIONS)[number]) || !values.category ? CATEGORY_OPTIONS : [values.category, ...CATEGORY_OPTIONS];

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      {subscriptionId ? <input type="hidden" name="id" value={subscriptionId} /> : null}
      <input type="hidden" name="preset_id" value={values.presetId ?? ""} />

      {presets ? <PresetCatalogGrid result={presets} selectedId={values.presetId} onSelect={applyPreset} disabled={pending} /> : null}

      <section aria-labelledby="required-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <h2 id="required-heading" className="text-section text-foreground">
          필수 정보
        </h2>
        <div aria-live="polite">{state.status === "error" && !errors ? <FormMessage tone="error">{state.message}</FormMessage> : null}</div>
        <TextField
          id="service_name"
          name="service_name"
          type="text"
          label="서비스명"
          autoComplete="off"
          value={values.serviceName}
          onChange={(value) => set("serviceName", value)}
          disabled={pending}
          error={errors?.service_name}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-caption font-semibold text-foreground">
            카테고리
          </label>
          <select
            id="category"
            name="category"
            value={values.category}
            onChange={(event) => set("category", event.target.value)}
            disabled={pending}
            aria-invalid={errors?.category ? true : undefined}
            aria-describedby={errors?.category ? "category-error" : undefined}
            className={`${inputStyles} ${errors?.category ? "border-status-danger" : ""}`}
          >
            <option value="">카테고리 선택</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <FieldError id="category-error" message={errors?.category} />
        </div>
        <SegmentedControl
          name="currency"
          legend="통화"
          options={CURRENCY_CODES.map((code) => ({ value: code, label: CURRENCY_LABELS[code] }))}
          value={values.currency}
          onChange={(value) => set("currency", value)}
          disabled={pending}
          error={errors?.currency}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="amount" className="text-caption font-semibold text-foreground">
            결제 금액 ({values.currency === "KRW" ? "원" : "달러"})
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={values.amount}
            onChange={(event) => set("amount", event.target.value)}
            disabled={pending}
            aria-invalid={errors?.amount ? true : undefined}
            aria-describedby={errors?.amount ? "amount-error" : undefined}
            className={`${inputStyles} ${errors?.amount ? "border-status-danger" : ""}`}
          />
          <FieldError id="amount-error" message={errors?.amount} />
        </div>
        <SegmentedControl
          name="billing_cycle"
          legend="결제 주기"
          options={BILLING_CYCLES.map((cycle) => ({ value: cycle, label: CYCLE_LABELS[cycle] }))}
          value={values.billingCycle}
          onChange={(value) => set("billingCycle", value)}
          disabled={pending}
          error={errors?.billing_cycle}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="next_billing_date" className="text-caption font-semibold text-foreground">
            다음 결제 예정일
          </label>
          <input
            id="next_billing_date"
            name="next_billing_date"
            type="date"
            value={values.nextBillingDate}
            onChange={(event) => set("nextBillingDate", event.target.value)}
            disabled={pending}
            aria-invalid={errors?.next_billing_date ? true : undefined}
            aria-describedby={errors?.next_billing_date ? "next_billing_date-error" : undefined}
            className={`${inputStyles} ${errors?.next_billing_date ? "border-status-danger" : ""}`}
          />
          <FieldError id="next_billing_date-error" message={errors?.next_billing_date} />
        </div>
        {subscriptionId ? (
          <SegmentedControl
            name="status"
            legend="이용 상태"
            options={SUBSCRIPTION_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))}
            value={values.status}
            onChange={(value) => set("status", value)}
            disabled={pending}
            error={errors?.status}
          />
        ) : (
          <input type="hidden" name="status" value="ACTIVE" />
        )}
      </section>

      <section aria-labelledby="optional-heading" className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
        <h2 id="optional-heading" className="text-section text-foreground">
          선택 정보
        </h2>
        <TextField
          id="payment_method_memo"
          name="payment_method_memo"
          type="text"
          label="결제 수단 메모"
          autoComplete="off"
          hint="카드번호가 아닌 식별용 별칭을 적어주세요 (예: 현대 제로카드)"
          value={values.paymentMethodMemo}
          onChange={(value) => set("paymentMethodMemo", value)}
          disabled={pending}
          error={errors?.payment_method_memo}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="memo" className="text-caption font-semibold text-foreground">
            메모
          </label>
          <textarea
            id="memo"
            name="memo"
            rows={3}
            value={values.memo}
            onChange={(event) => set("memo", event.target.value)}
            disabled={pending}
            aria-invalid={errors?.memo ? true : undefined}
            aria-describedby={errors?.memo ? "memo-error" : undefined}
            className={`${inputStyles} py-2 ${errors?.memo ? "border-status-danger" : ""}`}
          />
          <FieldError id="memo-error" message={errors?.memo} />
        </div>
      </section>

      <button type="submit" disabled={pending} className={`${buttonStyles.primary} w-full`}>
        {pending ? <Spinner /> : null}
        {pending ? "저장하고 있어요..." : submitLabel}
      </button>
    </form>
  );
}
