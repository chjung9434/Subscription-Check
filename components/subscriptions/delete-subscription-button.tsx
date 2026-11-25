"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles, dangerButtonStyles } from "@/components/ui/styles";
import { deleteSubscriptionAction } from "@/lib/actions/subscriptions";
import { IDLE } from "@/lib/form-state";

export function DeleteSubscriptionButton({ id, serviceName }: { id: string; serviceName: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteSubscriptionAction, IDLE);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonStyles.secondary} w-full text-status-danger`}>
        <Trash2 aria-hidden="true" className="size-4" />
        삭제
      </button>
      <Dialog open={open} onClose={() => (pending ? undefined : setOpen(false))} title="구독을 삭제할까요?">
        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          <p className="text-body text-muted-foreground">
            <strong className="text-foreground">{serviceName}</strong> 구독 정보와 예정된 알림이 삭제되며 되돌릴 수 없어요.
          </p>
          {state.status === "error" ? <FormMessage tone="error">{state.message}</FormMessage> : null}
          <button type="submit" disabled={pending} className={dangerButtonStyles}>
            {pending ? <Spinner /> : null}
            {pending ? "삭제하고 있어요..." : "삭제"}
          </button>
          <button type="button" disabled={pending} onClick={() => setOpen(false)} className={buttonStyles.ghost}>
            취소
          </button>
        </form>
      </Dialog>
    </>
  );
}
