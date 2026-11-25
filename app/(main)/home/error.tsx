"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

export default function HomeError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[home] route error", error);
  }, [error]);

  return (
    <section role="alert" className={`${cardStyles} flex flex-col items-start gap-3`}>
      <h1 className="text-section text-foreground">대시보드 정보를 불러오지 못했습니다</h1>
      <p className="text-body text-muted-foreground">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button type="button" onClick={() => retry()} className={buttonStyles.primary}>
        <RotateCw aria-hidden="true" className="size-5" />
        다시 시도
      </button>
    </section>
  );
}
