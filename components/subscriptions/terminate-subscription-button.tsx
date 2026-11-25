"use client";

import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles } from "@/components/ui/styles";
import { terminateSubscriptionAction } from "@/lib/actions/subscriptions";

export function TerminateSubscriptionButton({ id, serviceName }: { id: string; serviceName: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await terminateSubscriptionAction({ id });
        if (!result.success) {
          setMessage({ tone: "error", text: result.message });
          return;
        }
        // 성공하면 화면이 '종료' 상태로 다시 그려지며 안내가 표시된다. 경고만 여기서 보여준다.
        setOpen(false);
        if (result.warning) setMessage({ tone: "error", text: result.warning });
      } catch {
        setMessage({ tone: "error", text: "구독을 종료하지 못했어요. 다시 시도해 주세요." });
      }
    });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonStyles.secondary} w-full`}>
        해지 완료 후 구독 종료 처리
      </button>
      {message && !open ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <Dialog open={open} onClose={() => (pending ? undefined : setOpen(false))} title="구독을 종료로 바꿀까요?">
        <div className="flex flex-col gap-3">
          <p className="text-body text-muted-foreground">
            공식 사이트에서 {serviceName} 해지를 마쳤다면 종료로 바꿔 주세요. 결제 예정액 계산과 결제 알림에서 빠져요.
          </p>
          {message && open ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
          <button type="button" onClick={confirm} disabled={pending} className={buttonStyles.primary}>
            {pending ? <Spinner /> : null}
            {pending ? "바꾸고 있어요..." : "종료로 바꾸기"}
          </button>
          <button type="button" onClick={() => setOpen(false)} disabled={pending} className={buttonStyles.ghost}>
            취소
          </button>
        </div>
      </Dialog>
    </>
  );
}
