export default function HomeLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">홈 화면을 불러오는 중이에요.</span>
      <div className="mb-6 h-8 w-40 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="h-30 w-full rounded-xl bg-border motion-safe:animate-pulse" />
    </div>
  );
}
