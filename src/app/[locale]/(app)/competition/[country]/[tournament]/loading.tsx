export default function CompetitionLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8">
      <div className="space-y-4">
        <div className="h-48 animate-pulse rounded-xl bg-bg-surface-2" />
        <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[256px_minmax(0,1fr)_320px] xl:gap-6">
          <div className="hidden h-96 animate-pulse rounded-xl bg-bg-surface-2 xl:block" />
          <div className="h-96 animate-pulse rounded-xl bg-bg-surface-2" />
          <div className="hidden h-96 animate-pulse rounded-xl bg-bg-surface-2 xl:block" />
        </div>
      </div>
    </div>
  );
}
