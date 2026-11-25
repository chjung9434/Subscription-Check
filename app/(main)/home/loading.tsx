export default function HomeLoading() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">대시보드를 불러오는 중이에요.</span>
      <div className="mb-6 h-8 w-24 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="mb-6 h-24 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="h-28 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="mt-6 mb-3 h-6 w-28 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-20 rounded-xl bg-border motion-safe:animate-pulse" />
        ))}
      </div>
    </div>
  );
}
