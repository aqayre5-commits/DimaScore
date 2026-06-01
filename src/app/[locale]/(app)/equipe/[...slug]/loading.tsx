export default function TeamLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse px-4 py-6">
      {/* Breadcrumb skeleton */}
      <div className="mb-4 h-4 w-48 rounded bg-bg-surface-2" />
      {/* Header skeleton */}
      <div className="mb-6 h-36 rounded-xl bg-bg-surface-2" />
      {/* Tabs skeleton */}
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 rounded-lg bg-bg-surface-2" />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_280px]">
        <div className="hidden h-80 rounded-xl bg-bg-surface-2 lg:block" />
        <div className="h-80 rounded-xl bg-bg-surface-2" />
        <div className="hidden h-64 rounded-xl bg-bg-surface-2 lg:block" />
      </div>
    </div>
  );
}
