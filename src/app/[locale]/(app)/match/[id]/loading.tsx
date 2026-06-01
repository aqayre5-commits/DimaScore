export default function MatchLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
      <div className="mb-2 h-4 w-48 animate-pulse rounded bg-bg-surface-2" />
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:gap-6">
        <div className="order-2 hidden space-y-4 xl:order-none xl:block">
          <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
          <div className="h-32 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
        <div className="order-1 space-y-4 xl:order-none">
          <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
          <div className="h-96 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
        <div className="order-3 hidden space-y-4 xl:order-none xl:block">
          <div className="h-64 animate-pulse rounded-xl bg-bg-surface-2" />
          <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
