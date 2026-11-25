"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

export default function SettingsError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[settings] route error", error);
  }, [error]);

  return (
    <section role="alert" className={`${cardStyles} flex flex-col items-start gap-4`}>
      <p className="text-body text-foreground">설정 정보를 불러오지 못했습니다. 네트워크 상태를 확인한 후 다시 시도해 주세요.</p>
      <button type="button" onClick={() => retry()} className={buttonStyles.primary}>
        <RotateCw aria-hidden="true" className="size-5" />
        다시 시도
      </button>
    </section>
  );
}
