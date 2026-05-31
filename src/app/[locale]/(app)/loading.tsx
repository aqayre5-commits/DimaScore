export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8">
      {/* Hero skeleton */}
      <div className="bg-surface-2 mb-6 h-48 rounded-xl" />
      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="bg-surface-2 h-32 rounded-lg" />
          <div className="bg-surface-2 h-64 rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="bg-surface-2 h-10 rounded-lg" />
          <div className="bg-surface-2 h-96 rounded-lg" />
        </div>
        <div className="space-y-4">
          <div className="bg-surface-2 h-48 rounded-lg" />
          <div className="bg-surface-2 h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
