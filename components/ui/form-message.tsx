import { CircleAlert, CircleCheck } from "lucide-react";

/** 폼 상단 결과 배너. 상태는 색과 아이콘·문구로 함께 전달하고 스크린 리더에 알린다. */
export function FormMessage({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  const Icon = tone === "error" ? CircleAlert : CircleCheck;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-2 rounded-xl p-3 text-body ${
        tone === "error" ? "bg-status-danger-subtle text-status-danger" : "bg-status-success-subtle text-status-success"
      }`}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-caption text-status-danger">
      {message}
    </p>
  );
}
