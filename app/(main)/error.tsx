"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

/** 하위 화면 오류 시 셸(헤더·탭 바)은 유지하고 콘텐츠 영역에만 안내와 재시도를 보여준다. */
export default function MainError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[main] route error", error);
  }, [error]);

  return (
    <section role="alert" className={`${cardStyles} flex flex-col items-start gap-4`}>
      <p className="text-body text-foreground">화면을 불러오지 못했습니다. 다시 시도해 주세요.</p>
      <button type="button" onClick={() => retry()} className={buttonStyles.primary}>
        <RotateCw aria-hidden="true" className="size-5" />
        다시 시도
      </button>
    </section>
  );
}
