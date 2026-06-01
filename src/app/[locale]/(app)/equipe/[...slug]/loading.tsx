export default function TeamLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 pt-4">
      <div className="mb-2 h-4 w-56 animate-pulse rounded bg-bg-surface-2" />
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:items-start xl:gap-6">
        <div className="order-0 xl:col-span-2 xl:col-start-1 xl:row-start-1">
          <div className="h-32 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
        <div className="order-3 hidden xl:col-start-3 xl:row-start-1 xl:block">
          <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
        <div className="order-2 xl:col-start-1 xl:row-start-2">
          <div className="h-96 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
        <div className="order-1 xl:col-start-2 xl:row-start-2">
          <div className="h-64 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
        <div className="order-3 hidden xl:col-start-3 xl:row-start-2 xl:block">
          <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
        </div>
      </div>
    </div>
  );
}
