/**
 * Match-page loading boundary (soft navigation): blank outlines of the match centre's header card,
 * tab row and two columns, no text, so nothing from another layout flashes in.
 */
export default function MatchLoading() {
  return (
    <div className="mx-auto w-full max-w-[1580px] animate-pulse px-[10px] pb-10 pt-3 md:ps-[calc(clamp(216px,17vw,262px)+2.5rem)] md:pe-8">
      <div className="h-[208px] rounded-lg bg-bg-surface-2 md:h-[220px]" />
      <div className="mt-2 h-11 bg-bg-surface-2" />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]">
        <div className="h-64 rounded-lg bg-bg-surface-2" />
        <div className="h-40 rounded-lg bg-bg-surface-2" />
      </div>
    </div>
  );
}
