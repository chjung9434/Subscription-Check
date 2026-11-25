/** 화면 전환 중 콘텐츠 자리만 스켈레톤으로 바꾼다 (헤더·탭 바는 레이아웃에 남아 있음). */
export default function MainLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">화면을 불러오는 중이에요.</span>
      <div className="mb-6 h-8 w-40 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="h-30 w-full rounded-xl bg-border motion-safe:animate-pulse" />
    </div>
  );
}
