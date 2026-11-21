import { useId } from 'react';
import type { EventKind } from '@/lib/match/match-view';

/** Small inline icons for event rows (decorative: the row text names the event). */
export function EventIcon({
  kind,
  className = '',
  accentGoal = false,
  large = false,
}: {
  kind: EventKind;
  className?: string;
  /** Desktop rows of Key moments / Match events: the mockups' larger cards and ball. */
  large?: boolean | 'xl';
  /** Events tab: scored goals use the accent colour and a larger ball, as in the mockup. */
  accentGoal?: boolean;
}) {
  const cls = `inline-block shrink-0 ${className}`;
  const card =
    large === 'xl'
      ? 'h-[20.3px] w-[15.94px] md:h-[28.48px] md:w-[24.5px] md:rounded-[3px]'
      : large
        ? 'h-[14.75px] w-[11.28px] md:h-[18.62px] md:w-[15.04px] md:rounded-[3px]'
        : 'h-4 w-3';
  // Ball box = ink size × 24/23.6 (the outlined circle spans 23.6 of the 24-unit viewBox).
  const ballMd = large === 'xl' ? 'md:size-[33.4px]' : large ? 'md:size-[19.67px]' : '';
  const ball = `${large === 'xl' ? 'size-[23.84px]' : accentGoal ? 'size-5' : large ? 'size-[14.12px]' : ''} ${ballMd}`;
  const glyph = large === 'xl' ? 'size-5' : large ? 'size-4 md:size-5' : 'size-4';
  switch (kind) {
    case 'goal':
    case 'penaltyGoal':
    case 'ownGoal':
    case 'missedPenalty':
      return (
        <BallIcon
          className={`${cls} ${
            kind === 'ownGoal' || kind === 'missedPenalty'
              ? 'text-accent-crimson'
              : accentGoal
                ? 'text-[#07a616]'
                : 'text-text-primary'
          } ${ball}`}
        />
      );
    case 'yellowCard':
      return <span aria-hidden className={`${cls} ${card} rounded-[2px] bg-[#fdce06]`} />;
    case 'redCard':
      return <span aria-hidden className={`${cls} ${card} rounded-[2px] bg-red-500`} />;
    case 'secondYellow':
      return (
        <span
          aria-hidden
          className={`${cls} relative ${large ? 'size-4 md:size-[22px]' : 'size-4'}`}
        >
          <span className="absolute start-0 top-0 h-3.5 w-2.5 rounded-[2px] bg-[#fdce06]" />
          <span className="absolute bottom-0 end-0 h-3.5 w-2.5 rounded-[2px] bg-red-500" />
        </span>
      );
    case 'substitution':
      return (
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`${cls} ${glyph} text-accent-green`}
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
          className={`${cls} ${glyph} text-text-secondary`}
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

/** The mockups' classic football: white panels, a dark centre pentagon and edge patches, outlined
 *  in the current text colour (black in Key moments and the header, green for goals in Events). */
export function BallIcon({ className = '' }: { className?: string }) {
  const clip = `ball-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={/\bsize-/.test(className) ? className : `size-4 ${className}`}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="12" cy="12" r="10.6" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="10.6" fill="#ffffff" />
      <g clipPath={`url(#${clip})`} fill="currentColor">
        <path d="M12.00 8.20L15.61 10.83L14.23 15.07L9.77 15.07L8.39 10.83Z" />
        <circle cx="12.00" cy="0.80" r="4" />
        <circle cx="22.65" cy="8.54" r="4" />
        <circle cx="18.58" cy="21.06" r="4" />
        <circle cx="5.42" cy="21.06" r="4" />
        <circle cx="1.35" cy="8.54" r="4" />
      </g>
      <circle cx="12" cy="12" r="10.6" fill="none" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  );
}

export function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={/\b(size|w)-/.test(className) ? className : `size-4 ${className}`}
      preserveAspectRatio="none"
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
