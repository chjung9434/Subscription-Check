"use client";

import { RotateCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

export default function SubscriptionsError({ error, retry }: { error: unknown; retry: () => void }) {
  const calendar = useSearchParams().get("view") === "calendar";
  useEffect(() => {
    console.error("[subscriptions] route error", error);
  }, [error]);

  return (
    <section role="alert" className={`${cardStyles} flex flex-col items-start gap-4`}>
      <p className="text-body text-foreground">{calendar ? "일정을 불러오지 못했습니다." : "구독 목록을 불러오지 못했습니다."} 잠시 후 다시 시도해 주세요.</p>
      <button type="button" onClick={() => retry()} className={buttonStyles.primary}>
        <RotateCw aria-hidden="true" className="size-5" />
        다시 시도
      </button>
    </section>
  );
}
