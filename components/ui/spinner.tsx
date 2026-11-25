import { LoaderCircle } from "lucide-react";

export function Spinner() {
  return <LoaderCircle aria-hidden="true" className="size-5 motion-safe:animate-spin" />;
}
