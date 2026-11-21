import type { EventKind } from '@/lib/match/match-view';

/** Small inline icons for event rows (decorative: the row text names the event). */
export function EventIcon({ kind, className = '' }: { kind: EventKind; className?: string }) {
  const cls = `inline-block shrink-0 ${className}`;
  switch (kind) {
    case 'goal':
    case 'penaltyGoal':
    case 'ownGoal':
    case 'missedPenalty':
      return (
        <BallIcon
          className={`${cls} ${kind === 'ownGoal' || kind === 'missedPenalty' ? 'text-accent-crimson' : 'text-text-primary'}`}
        />
      );
    case 'yellowCard':
      return <span aria-hidden className={`${cls} h-4 w-3 rounded-[2px] bg-[#f5c518]`} />;
    case 'redCard':
      return <span aria-hidden className={`${cls} h-4 w-3 rounded-[2px] bg-[#e03131]`} />;
    case 'secondYellow':
      return (
        <span aria-hidden className={`${cls} relative h-4 w-4`}>
          <span className="absolute start-0 top-0 h-3.5 w-2.5 rounded-[2px] bg-[#f5c518]" />
          <span className="absolute bottom-0 end-0 h-3.5 w-2.5 rounded-[2px] bg-[#e03131]" />
        </span>
      );
    case 'substitution':
      return (
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`${cls} size-4 text-accent-green`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 5h10l-3-3M14 11H4l3 3" />
        </svg>
      );
    case 'var':
      return (
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`${cls} size-4 text-text-secondary`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <rect x="1.5" y="2.5" width="13" height="9" rx="1.5" />
          <path d="M5.5 14h5" strokeLinecap="round" />
        </svg>
      );
    default:
      return <span aria-hidden className={`${cls} size-2 rounded-full bg-text-tertiary`} />;
  }
}

export function BallIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`size-4 ${className}`}>
      <circle cx="8" cy="8" r="7" fill="currentColor" />
      <path d="M8 4.6l2.3 1.7-.9 2.7H6.6l-.9-2.7z" className="fill-bg-surface" />
      <path
        d="M8 1v3.6M10.3 6.3l3.4-1.1M9.4 9l2.1 2.9M6.6 9l-2.1 2.9M5.7 6.3L2.3 5.2"
        className="stroke-bg-surface"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`size-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
