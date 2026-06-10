import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { BracketMatch } from './BracketMatchCell';

/**
 * Compact knockout-bracket node. Two team rows (flag + 3-letter code + score, with a reserved
 * penalty slot so main scores stay aligned across cards) over a thin status footer
 * (FT / AET [+ · Pen] / ● LIVE / kickoff date). No winner tint. `w-full` so it fits both the
 * fixed desktop column (~176px) and the wider mobile slide (≤280px). `data-match-id` is kept for
 * parity with the other bracket cells (mobile draws no connectors; desktop uses CSS arms).
 */
export function BracketCardNode({ match }: { match: BracketMatch }) {
  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const showScore = isLive || isFinished;
  const hasPens = match.homeScorePen != null && match.awayScorePen != null;
  const ftLabel = match.statusCode === 'AET' ? 'AET' : 'FT';

  return (
    <div
      data-match-id={match.matchId}
      className={cn(
        'w-full overflow-hidden rounded-lg border bg-bg-surface',
        isLive ? 'border-score-live/50' : 'border-border-subtle',
      )}
    >
      <div className="divide-y divide-border-subtle/60">
        <NodeRow
          logoUrl={match.homeLogoUrl}
          code={match.homeLabel}
          score={match.homeScore}
          pen={match.homeScorePen}
          showScore={showScore}
          isLive={isLive}
        />
        <NodeRow
          logoUrl={match.awayLogoUrl}
          code={match.awayLabel}
          score={match.awayScore}
          pen={match.awayScorePen}
          showScore={showScore}
          isLive={isLive}
        />
      </div>

      <div className="border-t border-border-subtle bg-bg-surface-2 px-2 py-1 text-center">
        {isLive ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-score-live">
            <span className="size-1.5 animate-pulse rounded-full bg-score-live" />
            {match.statusCode === 'HT' ? 'HT' : 'LIVE'}
          </span>
        ) : isFinished ? (
          <span className="text-[11px] font-bold text-text-secondary">
            {ftLabel}
            {hasPens && <span className="ml-1 font-medium text-text-tertiary">· Pen</span>}
          </span>
        ) : (
          <span className="text-[11px] font-medium text-text-tertiary">{match.statusLabel}</span>
        )}
      </div>
    </div>
  );
}

function NodeRow({
  logoUrl,
  code,
  score,
  pen,
  showScore,
  isLive,
}: {
  logoUrl?: string | null;
  code: string;
  score?: number | null;
  pen?: number | null;
  showScore: boolean;
  isLive: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
        />
      ) : (
        <span className="size-5 shrink-0 rounded bg-bg-surface-2" />
      )}
      <span className="text-sm font-bold tabular-nums text-text-primary">{code}</span>
      <span className="ml-auto flex items-baseline tabular-nums">
        <span
          className={cn(
            'w-5 text-right text-lg font-bold',
            !showScore ? 'text-text-quaternary' : isLive ? 'text-score-live' : 'text-text-primary',
          )}
        >
          {showScore ? (score ?? '–') : '–'}
        </span>
        {/* Reserved penalty slot (kept even when empty) so main scores align across cards */}
        <span className="w-7 pl-1 text-left text-xs font-medium text-text-tertiary">
          {pen != null ? `(${pen})` : ''}
        </span>
      </span>
    </div>
  );
}
