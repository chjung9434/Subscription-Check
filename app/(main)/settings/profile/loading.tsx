export default function SettingsLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">설정을 불러오는 중이에요.</span>
      <div className="h-8 w-44 rounded-xl bg-border motion-safe:animate-pulse" />
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-32 rounded-xl bg-border motion-safe:animate-pulse" />
      ))}
    </div>
  );
}
