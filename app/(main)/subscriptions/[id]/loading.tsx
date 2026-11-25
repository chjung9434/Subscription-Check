export default function SubscriptionDetailLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">구독 정보를 불러오는 중이에요.</span>
      <div className="h-8 w-40 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="h-40 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="flex flex-col gap-3 rounded-xl bg-border p-4 motion-safe:animate-pulse">
        <div className="h-5 w-24 rounded-xl bg-surface" />
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-4 rounded-xl bg-surface" />
        ))}
        <div className="h-11 rounded-xl bg-surface" />
      </div>
    </div>
  );
}
