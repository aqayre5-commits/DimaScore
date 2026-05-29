'use client';

import type { Locale } from '@/lib/i18n/config';
import { BracketMatchCell, type BracketMatch, type KnockoutPhase } from './BracketMatchCell';
import { ROUND_LABELS } from '@/lib/constants/wc2026-bracket-builder';
import type { BracketGridConfig } from '@/lib/constants/dynamic-bracket-builder';

const PHASE_ORDER: KnockoutPhase[] = ['r32', 'r16', 'qf', 'sf', 'final'];

interface DynamicDesktopBracketProps {
  matches: BracketMatch[];
  thirdPlaceMatch?: BracketMatch;
  locale: Locale;
  gridConfig: BracketGridConfig;
}

/**
 * Builds bracket-tree-ordered match lists per round.
 * Traces from Final backwards via feedsInto so that pairs feeding
 * the same next-round match are adjacent — this makes flex space-around
 * naturally align the bracket.
 */
function buildBracketOrder(matches: BracketMatch[]): Map<KnockoutPhase, BracketMatch[]> {
  // Reverse feed map: targetId → source matches
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

  // BFS backwards from final
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

  // Add orphan matches not reachable from final
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

/**
 * Desktop knockout bracket — linear left-to-right flow.
 * Each round is a flex column with space-around distribution.
 * Matches are ordered by bracket-tree traversal from Final backwards
 * so that feeding pairs naturally align.
 */
export function DynamicDesktopBracket({
  matches,
  thirdPlaceMatch,
  locale,
}: DynamicDesktopBracketProps) {
  const labels = ROUND_LABELS[locale] ?? ROUND_LABELS.en;
  const phases = PHASE_ORDER.filter((p) => matches.some((m) => m.phase === p));
  const ordered = buildBracketOrder(matches);

  // Height based on outermost round match count
  const firstPhase = phases[0];
  const maxMatches = (ordered.get(firstPhase) ?? []).length;
  const minHeight = Math.max(maxMatches * 90, 400);

  return (
    <div className="overflow-x-auto pb-4">
      <div
        className="flex items-stretch"
        style={{
          minWidth: `${phases.length * 190}px`,
          minHeight: `${minHeight}px`,
        }}
      >
        {phases.map((phase, phaseIdx) => {
          const roundMatches = ordered.get(phase) ?? [];
          const isLast = phaseIdx === phases.length - 1;

          return (
            <div key={phase} className="flex min-w-0 flex-col" style={{ width: '190px' }}>
              {/* Round header */}
              <div className="mb-3 whitespace-nowrap text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">
                {labels[phase] ?? phase}
              </div>

              {/* Matches — space-around for natural bracket alignment */}
              <div className="flex flex-1 flex-col justify-around">
                {roundMatches.map((match) => (
                  <div key={match.matchId} className="flex items-center px-1 py-1">
                    <BracketMatchCell match={match} />
                    {!isLast && <div className="ml-1 h-px w-4 shrink-0 bg-text-tertiary/30" />}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3rd place match */}
      {thirdPlaceMatch && (
        <div className="mt-6 flex justify-center">
          <div>
            <div className="mb-1 text-center text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {labels['3rd'] ?? '3rd Place'}
            </div>
            <div className="px-1">
              <BracketMatchCell match={thirdPlaceMatch} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
