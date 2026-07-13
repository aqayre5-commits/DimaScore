import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface FlagProps {
  /** ISO-3166 alpha-2 code (e.g. 'MA') — renders the country flag for national teams / nationalities. */
  countryCode?: string | null;
  /** Club crest URL (api-sports team logo). Used only for non-national teams. */
  logoUrl?: string | null;
  /** National team / country flag. When true (or when only a countryCode is given), the 4:3 flag wins. */
  isNational?: boolean | null;
  /** Box height in px. National flags render 4:3 (width = round(size*4/3)); crests render square. */
  size?: number;
  /** Fallback initials/code shown when no image resolves. */
  label?: string | null;
  className?: string;
}

/**
 * Unified team/country flag. National teams and bare country codes render the api-sports
 * country flag (`flags/{cc}.svg`, all 640×480 = 4:3) in a 4:3 box; clubs render their square
 * crest; otherwise a consistent initials box. Competition/league logos are NOT flags — use
 * `CompetitionLogo` for those.
 */
export function Flag({ countryCode, logoUrl, isNational, size = 16, label, className }: FlagProps) {
  const cc = countryCode?.trim().toLowerCase();
  // National teams and bare country codes → the 4:3 country flag (uniform, ignores any crest).
  const asFlag = !!cc && (Boolean(isNational) || !logoUrl);
  const width = asFlag ? Math.round((size * 4) / 3) : size;
  const src = asFlag ? `https://media.api-sports.io/flags/${cc}.svg` : (logoUrl ?? null);

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={asFlag ? 96 : 72}
        height={72}
        style={{ width, height: size }}
        className={cn(
          'shrink-0 object-contain',
          asFlag && 'rounded-sm ring-1 ring-border-subtle/40',
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      style={{ width, height: size, fontSize: Math.max(8, Math.round(size * 0.46)) }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-sm bg-bg-surface-2 font-semibold uppercase leading-none text-text-tertiary',
        className,
      )}
    >
      {(label ?? '').slice(0, 2)}
    </span>
  );
}
