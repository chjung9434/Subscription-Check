export default function NewSubscriptionLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">인기 구독 서비스 목록을 불러오는 중이에요.</span>
      <div className="mb-6 h-8 w-36 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3, 4, 5].map((key) => (
          <div key={key} className="h-16 rounded-xl bg-border motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
