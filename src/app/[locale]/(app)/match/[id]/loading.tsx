export default function MatchLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8">
      {/* Match header skeleton */}
      <div className="bg-surface-2 mb-6 h-52 rounded-xl" />
      {/* Tabs skeleton */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface-2 h-9 w-20 rounded-lg" />
        ))}
      </div>
      {/* Match content skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="bg-surface-2 h-96 rounded-lg" />
        <div className="space-y-4">
          <div className="bg-surface-2 h-48 rounded-lg" />
          <div className="bg-surface-2 h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
