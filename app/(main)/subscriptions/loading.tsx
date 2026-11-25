export default function SubscriptionsLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">구독 목록을 불러오는 중이에요.</span>
      <div className="mb-6 h-8 w-32 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-24 rounded-xl bg-border motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
