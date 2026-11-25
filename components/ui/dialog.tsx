"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

/** 네이티브 <dialog> 기반 모달: 포커스 가두기·Esc 닫기·배경 비활성화를 브라우저가 처리한다. */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-32px)] max-w-sm rounded-xl bg-surface p-6 text-foreground backdrop:bg-foreground/40"
    >
      <h2 id={titleId} className="text-section">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </dialog>
  );
}
