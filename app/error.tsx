"use client";

import { RotateCw } from "lucide-react";
import { useEffect } from "react";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

/** 메인 셸 밖(로그인 화면 등)에서 난 오류 */
export default function RootError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[root] route error", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <section role="alert" className={`${cardStyles} flex flex-col items-start gap-4`}>
        <p className="text-body text-foreground">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
        <button type="button" onClick={() => retry()} className={buttonStyles.primary}>
          <RotateCw aria-hidden="true" className="size-5" />
          다시 시도
        </button>
      </section>
    </main>
  );
}
