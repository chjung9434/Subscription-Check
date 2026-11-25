"use client";

import { CircleCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { FieldError, FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, inputStyles } from "@/components/ui/styles";
import { submitCancellationReportAction } from "@/lib/actions/cancellation-report";
import type { FieldErrors } from "@/lib/form-state";
import { REPORT_REASON_LABELS, REPORT_REASONS, type ReportReason } from "@/lib/validations/cancellation-report";

export function CancellationReportButton({ subscriptionId, serviceName, label, title }: { subscriptionId: string; serviceName: string; label: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const openModal = () => {
    setReason(null);
    setDetails("");
    setErrors({});
    setFormError(null);
    setDone(null);
    setOpen(true);
  };

  const submit = () => {
    setErrors({});
    setFormError(null);
    if (!reason) {
      setErrors({ reportReason: "제보 사유를 선택해 주세요." });
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitCancellationReportAction({ subscriptionId, serviceName, reportReason: reason, details: details || null });
        if (result.success) {
          setOpen(false);
          setDone(result.message);
          return;
        }
        if (result.error.fieldErrors) setErrors(result.error.fieldErrors);
        else setFormError(result.error.message);
      } catch {
        setFormError("제보 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <>
      <button type="button" onClick={openModal} className={`${buttonStyles.ghost} w-full`}>
        {label}
      </button>
      {done ? (
        <p role="status" className="flex items-start gap-2 rounded-xl bg-status-success-subtle p-3 text-body text-status-success-foreground">
          <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          {done}
        </p>
      ) : null}
      <Dialog open={open} onClose={() => (pending ? undefined : setOpen(false))} title={title}>
        <div className="flex flex-col gap-4">
          <p className="text-body text-muted-foreground">{serviceName}의 해지 메뉴 위치나 링크가 변경되었나요? 변경된 내용을 알려주시면 빠르게 반영하겠습니다.</p>
          {formError ? <FormMessage tone="error">{formError}</FormMessage> : null}
          <fieldset aria-describedby={errors.reportReason ? "reportReason-error" : undefined} disabled={pending}>
            <legend className="mb-2 text-caption font-semibold text-foreground">제보 사유 (필수)</legend>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((value) => (
                <label
                  key={value}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border-strong px-3 text-body text-foreground has-checked:border-primary has-checked:bg-primary-subtle has-focus-visible:ring-2 has-focus-visible:ring-primary"
                >
                  <input type="radio" name="reportReason" value={value} checked={reason === value} onChange={() => {
                      setReason(value);
                      setErrors((prev) => ({ ...prev, reportReason: undefined }));
                    }} className="size-4 accent-primary" />
                  {REPORT_REASON_LABELS[value]}
                </label>
              ))}
            </div>
            <FieldError id="reportReason-error" message={errors.reportReason} />
          </fieldset>
          <div className="flex flex-col gap-1">
            <label htmlFor="report-details" className="text-caption font-semibold text-foreground">
              상세 내용 (선택)
            </label>
            <textarea
              id="report-details"
              rows={3}
              maxLength={500}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              disabled={pending}
              placeholder="예: 프로필 > 멤버십 관리 하단으로 이동됨"
              aria-describedby="report-details-count"
              className={`${inputStyles} py-2`}
            />
            <p id="report-details-count" className="text-right text-caption text-muted-foreground">
              {details.length}/500
            </p>
            <FieldError id="details-error" message={errors.details} />
          </div>
          <button type="button" onClick={submit} disabled={pending} className={buttonStyles.primary}>
            {pending ? <Spinner /> : null}
            {pending ? "보내고 있어요..." : "제보 등록"}
          </button>
          <button type="button" onClick={() => setOpen(false)} disabled={pending} className={buttonStyles.ghost}>
            취소
          </button>
        </div>
      </Dialog>
    </>
  );
}
