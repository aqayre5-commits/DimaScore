/**
 * Tiny SVG sparkline showing last N match ratings or form results.
 * Used in player headers (ratings) and team headers (W/D/L dots).
 */

interface RatingSparklineProps {
  ratings: number[];
  width?: number;
  height?: number;
}

function ratingColor(rating: number): string {
  if (rating >= 7.0) return 'var(--color-accent-green)';
  if (rating >= 6.0) return 'var(--color-accent-amber)';
  return 'var(--color-accent-crimson)';
}

export function RatingSparkline({ ratings, width = 80, height = 28 }: RatingSparklineProps) {
  if (ratings.length === 0) return null;

  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  // Scale ratings to SVG coordinates (min 4, max 10 for football ratings)
  const min = 4;
  const max = 10;
  const points = ratings.map((r, i) => {
    const x = padding + (ratings.length > 1 ? (i / (ratings.length - 1)) * innerW : innerW / 2);
    const y = padding + innerH - ((Math.min(Math.max(r, min), max) - min) / (max - min)) * innerH;
    return { x, y, rating: r };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-text-tertiary)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.5}
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill={ratingColor(p.rating)} />
      ))}
      {lastPoint && (
        <text
          x={lastPoint.x}
          y={lastPoint.y - 5}
          textAnchor="middle"
          fontSize={8}
          fontWeight={600}
          fill={ratingColor(lastPoint.rating)}
        >
          {lastPoint.rating.toFixed(1)}
        </text>
      )}
    </svg>
  );
}

// ── Team form dots (W/D/L) ──

export type FormResult = 'W' | 'D' | 'L';

interface FormDotsProps {
  results: FormResult[];
}

const FORM_COLORS: Record<FormResult, string> = {
  W: 'bg-accent-green',
  D: 'bg-accent-amber',
  L: 'bg-accent-crimson',
};

export function FormDots({ results }: FormDotsProps) {
  if (results.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {results.map((r, i) => (
        <span
          key={i}
          className={`flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white ${FORM_COLORS[r]}`}
          title={r}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
