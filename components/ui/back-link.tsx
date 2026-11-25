import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonStyles } from "./styles";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={`${buttonStyles.ghost} -ml-2 mb-2`}>
      <ChevronLeft aria-hidden="true" className="size-5" />
      {label}
    </Link>
  );
}
