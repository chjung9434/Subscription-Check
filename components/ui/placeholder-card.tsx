import type { ReactNode } from "react";
import { cardStyles } from "./styles";

/** 아직 기능이 없는 영역임을 알리는 안내 카드 */
export function PlaceholderCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={cardStyles}>
      <h2 className="text-section text-foreground">{title}</h2>
      <div className="mt-2 text-body text-muted-foreground">{children}</div>
    </section>
  );
}
