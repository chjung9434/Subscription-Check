import Link from "next/link";
import { buttonStyles, cardStyles } from "@/components/ui/styles";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4">
      <section className={`${cardStyles} flex flex-col items-start gap-4`}>
        <h1 className="text-section text-foreground">페이지를 찾을 수 없어요</h1>
        <p className="text-body text-muted-foreground">주소가 바뀌었거나 없는 페이지예요.</p>
        <Link href="/home" className={buttonStyles.primary}>
          홈으로 가기
        </Link>
      </section>
    </main>
  );
}
