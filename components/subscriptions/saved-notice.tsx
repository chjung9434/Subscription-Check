import { FormMessage } from "@/components/ui/form-message";

const MESSAGES: Record<string, string> = {
  created: "구독이 정상적으로 등록되었습니다.",
  updated: "구독 정보가 성공적으로 수정되었습니다.",
  deleted: "구독이 삭제되었습니다.",
};

/** 저장 후 리다이렉트된 화면 상단의 결과 안내 */
export function SavedNotice({ saved }: { saved: unknown }) {
  if (typeof saved !== "string" || !(saved in MESSAGES)) return null;
  return (
    <div className="mb-4">
      <FormMessage tone="success">{MESSAGES[saved]}</FormMessage>
    </div>
  );
}
