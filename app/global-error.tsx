"use client";

import { useEffect } from "react";
import "./globals.css";

/** 루트 레이아웃까지 실패한 경우의 마지막 안전망 (내부 정보는 보여주지 않는다) */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("[global] unhandled error", error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
          <h1 className="text-title text-foreground">구독체크</h1>
          <section role="alert" className="flex flex-col items-start gap-4 rounded-xl border border-border bg-surface p-4">
            <p className="text-body text-foreground">일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-body font-semibold text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              다시 시도
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
