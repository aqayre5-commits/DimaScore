/**
 * Match-page loading boundary (soft navigation): the new page canvas, so the
 * old Midnight Pitch surface does not flash between matches.
 */
export default function MatchLoading() {
  return <div className="ds-route-fallback" aria-hidden />;
}
