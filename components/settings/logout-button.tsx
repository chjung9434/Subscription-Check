"use client";

import { LogOut } from "lucide-react";
import { useState, useTransition } from "react";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Spinner } from "@/components/ui/spinner";
import { buttonStyles } from "@/components/ui/styles";
import { signOutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await signOutAction();
        if (result.status === "success") {
          // 전체 페이지 이동 + 기록 교체: 뒤로가기로 보호 화면 캐시가 보이지 않게 한다
          window.location.replace("/auth/login");
          return;
        }
        setError(result.status === "error" ? result.message : null);
      } catch {
        setError("로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`${buttonStyles.secondary} w-full`}>
        <LogOut aria-hidden="true" className="size-4" />
        로그아웃
      </button>
      <Dialog open={open} onClose={() => (pending ? undefined : setOpen(false))} title="로그아웃할까요?">
        <div className="flex flex-col gap-3">
          <p className="text-body text-muted-foreground">이 기기에서 로그아웃돼요. 등록한 구독 정보는 그대로 남아 있어요.</p>
          {error ? <FormMessage tone="error">{error}</FormMessage> : null}
          <button type="button" onClick={confirm} disabled={pending} className={buttonStyles.primary}>
            {pending ? <Spinner /> : null}
            {pending ? "로그아웃하고 있어요..." : "로그아웃"}
          </button>
          <button type="button" onClick={() => setOpen(false)} disabled={pending} className={buttonStyles.ghost}>
            취소
          </button>
        </div>
      </Dialog>
    </>
  );
}
