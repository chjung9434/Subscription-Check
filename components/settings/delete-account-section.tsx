"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/auth/actions";
import { IDLE } from "@/lib/auth/form-state";
import { TextField } from "@/components/auth/text-field";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, cardStyles, dangerButtonStyles } from "@/components/ui/styles";
import { DELETE_ACCOUNT_CONFIRMATION } from "@/lib/validations/auth";

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, action, pending] = useActionState(deleteAccountAction, IDLE);
  const confirmed = confirmation === DELETE_ACCOUNT_CONFIRMATION;

  return (
    <section className={cardStyles}>
      <h2 className="text-section text-foreground">회원 탈퇴</h2>
      <p className="mt-2 text-body text-muted-foreground">등록한 구독, 결제 수단 메모, 알림 설정과 기록이 모두 즉시 삭제되며 되돌릴 수 없어요.</p>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonStyles.secondary} mt-4 w-full text-status-danger`}>
        회원 탈퇴
      </button>

      <Dialog open={open} onClose={() => (pending ? undefined : setOpen(false))} title="정말 탈퇴할까요?">
        <form action={action} className="flex flex-col gap-4">
          <p className="text-body text-muted-foreground">
            계속하려면 아래에 <strong className="text-foreground">{DELETE_ACCOUNT_CONFIRMATION}</strong>를 입력해 주세요.
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
          <button type="submit" disabled={!confirmed || pending} className={dangerButtonStyles}>
            {pending ? <Spinner /> : null}
            {pending ? "모든 데이터를 안전하게 삭제하고 있어요..." : "탈퇴 및 데이터 파기"}
          </button>
          <button type="button" disabled={pending} onClick={() => setOpen(false)} className={buttonStyles.ghost}>
            취소
          </button>
        </form>
      </Dialog>
    </section>
  );
}
