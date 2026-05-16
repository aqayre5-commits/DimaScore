'use client';

import { useEffect, useState, type RefObject } from 'react';
import type { BracketMatch } from './BracketMatchCell';

interface BracketConnectorsProps {
  containerRef: RefObject<HTMLDivElement | null>;
  matches: BracketMatch[];
}

interface ConnectorPath {
  d: string;
  key: string;
}

/**
 * SVG overlay drawing L-shaped connector lines between adjacent bracket rounds.
 * Absolutely positioned over the DesktopBracket grid, pointer-events: none.
 *
 * RTL: reads container's computed direction and adjusts which cell edge
 * connectors originate from. Does NOT use scaleX(-1) — DOM coordinates
 * already reflect RTL layout, so flipping would double-invert paths.
 */
export function BracketConnectors({ containerRef, matches }: BracketConnectorsProps) {
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function recalc() {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });

      const isRtl = getComputedStyle(container).direction === 'rtl';

      const cellRects = new Map<string, DOMRect>();
      container.querySelectorAll<HTMLElement>('[data-match-id]').forEach((el) => {
        const id = el.dataset.matchId;
        if (id) cellRects.set(id, el.getBoundingClientRect());
      });

      const newPaths: ConnectorPath[] = [];

      // Group source matches by their feedsInto target
      const feedMap = new Map<string, BracketMatch[]>();
      for (const m of matches) {
        if (!m.feedsInto) continue;
        const arr = feedMap.get(m.feedsInto) ?? [];
        arr.push(m);
        feedMap.set(m.feedsInto, arr);
      }

      for (const [targetId, sources] of feedMap) {
        const targetRect = cellRects.get(targetId);
        if (!targetRect || sources.length < 2) continue;

        // Deterministic order by matchNumber
        const sourceRects = sources
          .map((s) => ({ match: s, rect: cellRects.get(s.matchId) }))
          .filter((s): s is { match: BracketMatch; rect: DOMRect } => !!s.rect)
          .sort((a, b) => a.match.matchNumber - b.match.matchNumber);

        if (sourceRects.length < 2) continue;

        const toRel = (r: DOMRect) => ({
          x: r.left - rect.left,
          y: r.top - rect.top,
          w: r.width,
          h: r.height,
        });

        const s1 = toRel(sourceRects[0].rect);
        const s2 = toRel(sourceRects[1].rect);
        const t = toRel(targetRect);

        const s1cy = s1.y + s1.h / 2;
        const s2cy = s2.y + s2.h / 2;
        const tcy = t.y + t.h / 2;

        // Detect opposite-side sources (e.g. SF-L col 4 + SF-R col 6 → Final col 5).
        // These should draw two independent lines, not one merged L-connector.
        const horizontalGap = Math.abs(s1.x + s1.w / 2 - (s2.x + s2.w / 2));
        if (horizontalGap > 200) {
          // Source 1 (left side) → target left edge
          newPaths.push({
            key: `${sourceRects[0].match.matchId}-${targetId}`,
            d: `M ${s1.x + s1.w} ${s1cy} H ${t.x} V ${tcy}`,
          });
          // Source 2 (right side) → target right edge
          newPaths.push({
            key: `${sourceRects[1].match.matchId}-${targetId}`,
            d: `M ${s2.x} ${s2cy} H ${t.x + t.w} V ${tcy}`,
          });
          continue;
        }

        // Direction-aware edge logic for same-column pairs:
        // LTR left-side: connectors go right (source right edge -> target left edge)
        // RTL left-side: connectors go left (source left edge -> target right edge)
        // dir="rtl" flips column visual order, so edges must also flip.
        const isLeftSide = sourceRects[0].match.side === 'left';
        const goRight = isLeftSide !== isRtl;

        // Source edge: right edge when going right, left edge when going left
        const s1x = goRight ? s1.x + s1.w : s1.x;
        const s2x = goRight ? s2.x + s2.w : s2.x;
        // Target edge: left edge when going right, right edge when going left
        const tx = goRight ? t.x : t.x + t.w;
        const midX = (s1x + tx) / 2;

        newPaths.push({
          key: `${sourceRects[0].match.matchId}-${targetId}`,
          d: [
            `M ${s1x} ${s1cy} H ${midX}`,
            `M ${s2x} ${s2cy} H ${midX}`,
            `M ${midX} ${s1cy} V ${s2cy}`,
            `M ${midX} ${tcy} H ${tx}`,
          ].join(' '),
        });
      }

      // Loser connectors (SF → 3rd place) — same style as winner connectors.
      // Mirrors the opposite-side logic used for SF→Final: each SF draws an
      // independent L-shaped line to the 3rd-place cell in the center column.
      for (const m of matches) {
        if (!m.loserFeedsInto) continue;
        const sourceRect = cellRects.get(m.matchId);
        const targetRect = cellRects.get(m.loserFeedsInto);
        if (!sourceRect || !targetRect) continue;

        const toRel = (r: DOMRect) => ({
          x: r.left - rect.left,
          y: r.top - rect.top,
          w: r.width,
          h: r.height,
        });

        const s = toRel(sourceRect);
        const t = toRel(targetRect);
        const scy = s.y + s.h / 2;
        const tcy = t.y + t.h / 2;

        // SF inner edge (toward center column) → 3rd-place facing edge
        const sx = m.side === 'left' ? s.x + s.w : s.x;
        const tx = m.side === 'left' ? t.x : t.x + t.w;

        newPaths.push({
          key: `loser-${m.matchId}-${m.loserFeedsInto}`,
          d: `M ${sx} ${scy} H ${tx} V ${tcy}`,
        });
      }

      setPaths(newPaths);
    }

    recalc();

    const ro = new ResizeObserver(recalc);
    ro.observe(container);
    return () => ro.disconnect();
  }, [containerRef, matches]);

  if (paths.length === 0) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={size.w}
      height={size.h}
      aria-hidden="true"
    >
      {paths.map((p) => (
        <path key={p.key} d={p.d} fill="none" stroke="var(--border-subtle)" strokeWidth={1.5} />
      ))}
    </svg>
  );
}
