export function CalendarSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">일정을 불러오는 중이에요.</span>
      <div className="h-11 w-48 rounded-xl bg-border motion-safe:animate-pulse" />
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }, (_, index) => (
          <div key={index} className="h-12 rounded-xl bg-border motion-safe:animate-pulse" />
        ))}
      </div>
      {[0, 1].map((key) => (
        <div key={key} className="h-20 rounded-xl bg-border motion-safe:animate-pulse" />
      ))}
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">구독 목록을 불러오는 중이에요.</span>
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="h-24 rounded-xl bg-border motion-safe:animate-pulse" />
      ))}
    </div>
  );
}
