function Box({ className }: { className?: string }) {
  return <div className={`rounded-2xl bg-bg-surface-2 ${className ?? ''}`} />;
}

/**
 * Match-page loading boundary (soft navigation): blank outlines of the page's own cards (header
 * card, tab row, Overview columns), no text, so nothing from the old layout flashes in.
 */
export default function MatchLoading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] animate-pulse px-4 pb-10 pt-3 md:pt-4">
      <Box className="h-[237px] md:h-[232px]" />
      <Box className="mt-4 h-11 rounded-none md:mt-6" />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:gap-6">
        <Box className="h-40" />
        <Box className="h-72" />
      </div>
    </div>
  );
}
