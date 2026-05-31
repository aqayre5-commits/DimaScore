'use client';

import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';
import type { BracketMatch, KnockoutPhase } from './BracketMatchCell';
import Image from 'next/image';

// ── UCL-specific round labels ───────────────────────────────────────────────

const UCL_LABELS: Record<string, Record<KnockoutPhase, string>> = {
  en: {
    r32: 'KO Play-offs',
    r16: 'Round of 16',
    qf: 'Quarter-finals',
    sf: 'Semi-finals',
    final: 'Final',
    '3rd': '3rd place',
  },
  fr: {
    r32: 'Barrages',
    r16: '8es de finale',
    qf: 'Quarts de finale',
    sf: 'Demi-finales',
    final: 'Finale',
    '3rd': '3ème place',
  },
  ar: {
    r32: 'الملحق',
    r16: 'دور الـ16',
    qf: 'ربع النهائي',
    sf: 'نصف النهائي',
    final: 'النهائي',
    '3rd': 'المركز الثالث',
  },
};

// UCL bracket starts at R16 — KO Playoffs (R32) are preliminary ties
const PHASE_ORDER: KnockoutPhase[] = ['r16', 'qf', 'sf', 'final'];

// ── Bracket tree ordering ───────────────────────────────────────────────────

function buildBracketOrder(matches: BracketMatch[]): Map<KnockoutPhase, BracketMatch[]> {
  const reverseFeeds = new Map<string, BracketMatch[]>();
  for (const m of matches) {
    if (m.feedsInto) {
      const arr = reverseFeeds.get(m.feedsInto) ?? [];
      arr.push(m);
      reverseFeeds.set(m.feedsInto, arr);
    }
  }

  const final = matches.find((m) => m.phase === 'final');
  if (!final) return groupByPhase(matches);

  const result = new Map<KnockoutPhase, BracketMatch[]>();
  result.set('final', [final]);

  let currentLevel = [final];
  while (currentLevel.length > 0) {
    const nextLevel: BracketMatch[] = [];
    for (const parent of currentLevel) {
      const children = (reverseFeeds.get(parent.matchId) ?? []).sort(
        (a, b) => a.matchNumber - b.matchNumber,
      );
      nextLevel.push(...children);
    }
    if (nextLevel.length === 0) break;
    const phase = nextLevel[0].phase;
    const existing = result.get(phase) ?? [];
    result.set(phase, [...existing, ...nextLevel]);
    currentLevel = nextLevel;
  }

  const placed = new Set<string>();
  for (const [, arr] of result) {
    for (const m of arr) placed.add(m.matchId);
  }
  for (const m of matches) {
    if (m.phase === '3rd' || placed.has(m.matchId)) continue;
    if (!result.has(m.phase)) result.set(m.phase, []);
    result.get(m.phase)!.push(m);
  }

  return result;
}

function groupByPhase(matches: BracketMatch[]): Map<KnockoutPhase, BracketMatch[]> {
  const map = new Map<KnockoutPhase, BracketMatch[]>();
  for (const m of matches) {
    if (m.phase === '3rd') continue;
    const arr = map.get(m.phase) ?? [];
    arr.push(m);
    map.set(m.phase, arr);
  }
  for (const [, arr] of map) {
    arr.sort((a, b) => a.matchNumber - b.matchNumber);
  }
  return map;
}

// ── Match card ──────────────────────────────────────────────────────────────

function UCLMatchCard({ match }: { match: BracketMatch }) {
  const showScores = match.status === 'finished' || match.status === 'live';
  const hasTwoLegs = match.homeLeg1Score != null && match.homeLeg2Score != null;
  const isSingleLeg = match.phase === 'final';

  const homeWon =
    showScores &&
    match.homeScore != null &&
    match.awayScore != null &&
    match.homeScore > match.awayScore;
  const awayWon =
    showScores &&
    match.homeScore != null &&
    match.awayScore != null &&
    match.awayScore > match.homeScore;

  return (
    <div
      data-match-id={match.matchId}
      className={cn(
        'w-[176px] shrink-0 overflow-hidden rounded-lg border bg-bg-surface text-xs',
        match.status === 'live' ? 'border-accent-emerald/50' : 'border-border-subtle',
      )}
    >
      {showScores && hasTwoLegs && (
        <div className="flex items-center border-b border-border-subtle bg-bg-surface-2 px-2 py-0.5">
          <div className="flex-1" />
          <span className="w-7 text-center text-[10px] font-semibold text-text-tertiary">M1</span>
          <span className="w-7 text-center text-[10px] font-semibold text-text-tertiary">M2</span>
        </div>
      )}

      <div
        className={cn(
          'flex items-center gap-1.5 border-b border-border-subtle px-2 py-1.5',
          homeWon && 'bg-accent-azure/5',
        )}
      >
        {match.homeLogoUrl ? (
          <Image
            src={match.homeLogoUrl}
            alt=""
            className="size-4 shrink-0 object-contain"
            width={16}
            height={16}
          />
        ) : (
          <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
        )}
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-medium',
            homeWon ? 'text-text-primary' : 'text-text-secondary',
          )}
        >
          {match.homeLabel}
        </span>
        {showScores && hasTwoLegs ? (
          <>
            <span
              className={cn(
                'w-7 text-center tabular-nums',
                homeWon ? 'font-bold text-text-primary' : 'text-text-secondary',
              )}
            >
              {match.homeLeg1Score ?? '–'}
            </span>
            <span
              className={cn(
                'w-7 text-center tabular-nums',
                homeWon ? 'font-bold text-text-primary' : 'text-text-secondary',
              )}
            >
              {match.homeLeg2Score ?? '–'}
            </span>
          </>
        ) : showScores ? (
          <span
            className={cn(
              'w-7 text-center tabular-nums',
              homeWon ? 'font-bold text-text-primary' : 'text-text-secondary',
            )}
          >
            {match.homeScore ?? '–'}
          </span>
        ) : null}
      </div>

      <div className={cn('flex items-center gap-1.5 px-2 py-1.5', awayWon && 'bg-accent-azure/5')}>
        {match.awayLogoUrl ? (
          <Image
            src={match.awayLogoUrl}
            alt=""
            className="size-4 shrink-0 object-contain"
            width={16}
            height={16}
          />
        ) : (
          <span className="inline-block size-4 shrink-0 rounded bg-bg-surface-2" />
        )}
        <span
          className={cn(
            'min-w-0 flex-1 truncate font-medium',
            awayWon ? 'text-text-primary' : 'text-text-secondary',
          )}
        >
          {match.awayLabel}
        </span>
        {showScores && hasTwoLegs ? (
          <>
            <span
              className={cn(
                'w-7 text-center tabular-nums',
                awayWon ? 'font-bold text-text-primary' : 'text-text-secondary',
              )}
            >
              {match.awayLeg1Score ?? '–'}
            </span>
            <span
              className={cn(
                'w-7 text-center tabular-nums',
                awayWon ? 'font-bold text-text-primary' : 'text-text-secondary',
              )}
            >
              {match.awayLeg2Score ?? '–'}
            </span>
          </>
        ) : showScores ? (
          <span
            className={cn(
              'w-7 text-center tabular-nums',
              awayWon ? 'font-bold text-text-primary' : 'text-text-secondary',
            )}
          >
            {match.awayScore ?? '–'}
          </span>
        ) : null}
      </div>

      <div className="border-t border-border-subtle bg-bg-surface-2 px-2 py-0.5 text-[10px] text-text-tertiary">
        {match.status === 'live' && (
          <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-accent-emerald align-middle" />
        )}
        {showScores && hasTwoLegs ? (
          <span>
            Aggregate: {match.homeScore ?? '–'} - {match.awayScore ?? '–'}
          </span>
        ) : showScores && isSingleLeg ? (
          <span>FT</span>
        ) : (
          <span>{match.statusLabel}</span>
        )}
      </div>
    </div>
  );
}

// ── Main bracket ────────────────────────────────────────────────────────────

interface UCLDesktopBracketProps {
  matches: BracketMatch[];
  locale: Locale;
}

export function UCLDesktopBracket({ matches, locale }: UCLDesktopBracketProps) {
  const labels = UCL_LABELS[locale] ?? UCL_LABELS.en;
  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));
  const ordered = buildBracketOrder(matches);

  const firstPhase = phases[0];
  const baseCount = (ordered.get(firstPhase) ?? []).length;
  const minHeight = Math.max(baseCount * 110, 600);

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="flex items-stretch"
        style={{ minWidth: `${phases.length * 224}px`, minHeight: `${minHeight}px` }}
      >
        {phases.map((phase, phaseIdx) => {
          const roundMatches = ordered.get(phase) ?? [];
          const roundCount = roundMatches.length;
          const isLast = phaseIdx === phases.length - 1;
          const shouldPair = roundCount > 1 && roundCount % 2 === 0;
          const pairFlex = roundCount > 0 ? (baseCount / roundCount) * 2 : baseCount;

          return (
            <div key={phase} className="flex min-w-0">
              {/* ── Match column ── */}
              <div className="flex flex-col" style={{ width: '176px' }}>
                <div className="mb-3 h-5 whitespace-nowrap text-center text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
                  {labels[phase] ?? phase}
                </div>
                <div className="flex flex-1 flex-col">
                  {shouldPair
                    ? Array.from({ length: Math.ceil(roundCount / 2) }, (_, i) => {
                        const m1 = roundMatches[i * 2];
                        const m2 = roundMatches[i * 2 + 1];
                        return (
                          <div
                            key={`pair-${i}`}
                            className="relative flex flex-col"
                            style={{ flex: pairFlex }}
                          >
                            <div className="flex flex-1 items-center">
                              <UCLMatchCard match={m1} />
                            </div>
                            {m2 && (
                              <div className="flex flex-1 items-center">
                                <UCLMatchCard match={m2} />
                              </div>
                            )}
                          </div>
                        );
                      })
                    : roundMatches.map((match) => (
                        <div
                          key={match.matchId}
                          className="flex items-center"
                          style={{ flex: baseCount }}
                        >
                          <UCLMatchCard match={match} />
                        </div>
                      ))}
                </div>
              </div>

              {/* ── Merge connector column ── */}
              {!isLast && shouldPair && (
                <div className="flex flex-col" style={{ width: '48px', minWidth: '48px' }}>
                  <div className="mb-3 h-5" />
                  <div className="flex flex-1 flex-col">
                    {Array.from({ length: Math.ceil(roundCount / 2) }, (_, i) => (
                      <div key={`merge-${i}`} className="relative" style={{ flex: pairFlex }}>
                        {/* Input arm from top match (25%) */}
                        <div
                          className="absolute h-px bg-border-subtle"
                          style={{ top: '25%', left: 0, width: '50%' }}
                        />
                        {/* Input arm from bottom match (75%) */}
                        <div
                          className="absolute h-px bg-border-subtle"
                          style={{ top: '75%', left: 0, width: '50%' }}
                        />
                        {/* Vertical bar connecting the two inputs */}
                        <div
                          className="absolute w-px bg-border-subtle"
                          style={{ top: '25%', bottom: '25%', left: '50%' }}
                        />
                        {/* Output arm to next round (50%) */}
                        <div
                          className="absolute h-px bg-border-subtle"
                          style={{ top: '50%', left: '50%', width: '50%' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
