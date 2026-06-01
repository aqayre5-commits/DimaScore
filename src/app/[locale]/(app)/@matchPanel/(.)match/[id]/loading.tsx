export default function MatchPanelLoading() {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {/* Score header skeleton */}
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="h-3 w-28 rounded bg-bg-surface-2" />
        <div className="flex items-center gap-6">
          <div className="size-12 rounded-full bg-bg-surface-2" />
          <div className="h-8 w-20 rounded bg-bg-surface-2" />
          <div className="size-12 rounded-full bg-bg-surface-2" />
        </div>
        <div className="flex gap-8">
          <div className="h-3 w-16 rounded bg-bg-surface-2" />
          <div className="h-3 w-16 rounded bg-bg-surface-2" />
        </div>
      </div>

      {/* Events skeleton */}
      <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-4 w-8 rounded bg-bg-surface-2" />
            <div className="h-4 flex-1 rounded bg-bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Stats skeleton */}
      <div className="space-y-3 rounded-xl border border-border-subtle bg-bg-surface p-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-3 w-8 rounded bg-bg-surface-2" />
            <div className="h-2 flex-1 rounded-full bg-bg-surface-2" />
            <div className="h-3 w-8 rounded bg-bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
