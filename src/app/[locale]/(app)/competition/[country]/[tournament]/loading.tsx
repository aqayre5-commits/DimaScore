export default function CompetitionLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8">
      {/* Competition hero skeleton */}
      <div className="bg-surface-2 mb-6 h-40 rounded-xl" />
      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-2 h-9 w-24 rounded-lg" />
        ))}
      </div>
      {/* 3-column layout skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr_280px]">
        <div className="space-y-4">
          <div className="bg-surface-2 h-48 rounded-lg" />
          <div className="bg-surface-2 h-64 rounded-lg" />
        </div>
        <div className="bg-surface-2 h-[500px] rounded-lg" />
        <div className="space-y-4">
          <div className="bg-surface-2 h-48 rounded-lg" />
          <div className="bg-surface-2 h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
