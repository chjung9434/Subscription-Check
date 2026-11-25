"use client";

import { useState, useTransition, type FormEvent } from "react";
import { deleteAccountAction } from "@/lib/auth/actions";
import { IDLE, type FormState } from "@/lib/form-state";
import { TextField } from "@/components/auth/text-field";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, cardStyles, dangerButtonStyles } from "@/components/ui/styles";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validations/auth";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState<FormState>(IDLE);
  const [pending, startTransition] = useTransition();
  const confirmed = confirmation === DELETE_ACCOUNT_CONFIRMATION;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await deleteAccountAction(IDLE, formData);
        setState(result);
        // 탈퇴 완료: 전체 페이지 이동 + 기록 교체로 탈퇴 전 화면 캐시를 버린다
        if (result.status === "success") window.location.replace("/auth/login?status=deleted");
      } catch {
        setState({ status: "error", code: "DELETE_FAILED", message: "회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." });
      }
    });
  };

  return (
    <section className={`${cardStyles} border-status-danger`} aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="text-section text-status-danger-foreground">
        회원 탈퇴
      </h2>
      <p className="mt-2 text-body text-muted-foreground">탈퇴 시 등록된 모든 구독 정보, 결제 예정일, 설정된 알림 데이터가 즉시 영구 삭제되며 복구할 수 없습니다.</p>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonStyles.secondary} mt-4 w-full text-status-danger`}>
        회원 탈퇴
      </button>

      <Dialog open={open} onClose={() => (pending ? undefined : setOpen(false))} title="정말 탈퇴할까요?">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <p className="text-body text-muted-foreground">
            탈퇴 시 등록된 모든 구독 정보, 결제 예정일, 설정된 알림 데이터가 즉시 영구 삭제되며 복구할 수 없습니다. 계속하려면 아래에 <strong className="text-foreground">{DELETE_ACCOUNT_CONFIRMATION}</strong>를 입력해 주세요.
          </p>
          {state.status === "error" && !state.fieldErrors ? <FormMessage tone="error">{state.message}</FormMessage> : null}
          <TextField
            id="delete-confirmation"
            name="confirmationText"
            type="text"
            label="확인 문구"
            autoComplete="off"
            disabled={pending}
            value={confirmation}
            onChange={setConfirmation}
            error={state.status === "error" ? state.fieldErrors?.confirmationText : undefined}
          />
          <button type="submit" disabled={!confirmed || pending || state.status === "success"} className={dangerButtonStyles}>
            {pending || state.status === "success" ? <Spinner /> : null}
            {pending || state.status === "success" ? "모든 데이터를 안전하게 삭제하고 있어요..." : "탈퇴하기"}
          </button>
          <button type="button" disabled={pending} onClick={() => setOpen(false)} className={buttonStyles.ghost}>
            취소
          </button>
        </form>
      </Dialog>
    </section>
  );
}
