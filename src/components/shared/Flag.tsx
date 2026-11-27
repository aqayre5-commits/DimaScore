import { cn } from '@/lib/utils';
import { flagImageSrc } from '@/lib/logos/flag-src';
import type { LogoStatus } from '@/lib/logos/status';
import { resolveTeamLogo } from '@/lib/constants/team-logos';
import { TeamMark } from './TeamMark';

export interface FlagProps {
  /** ISO-3166 alpha-2 code (e.g. 'MA') — renders the country flag for national teams / nationalities. */
  countryCode?: string | null;
  /** Club crest URL. Used only for non-national teams. Prefer `teamId` to avoid inlining URLs. */
  logoUrl?: string | null;
  logoStatus?: LogoStatus | null;
  /** Reconstructs the api-sports crest when `logoUrl` is omitted. Unused: a bare id 200s the placeholder. */
  teamId?: number | null;
  /** National team / country flag. When true (or when only a countryCode is given), the 4:3 flag wins. */
  isNational?: boolean | null;
  /** Box height in px. National flags render 4:3 (width = round(size*4/3)); crests render square. */
  size?: number;
  /** Fallback initials/code shown when no image resolves. */
  label?: string | null;
  name?: string | Record<string, string> | null;
  shortName?: string | Record<string, string> | null;
  code?: string | null;
  primary?: string | null;
  secondary?: string | null;
  /** Image alt text. Empty (decorative) by default, for badges next to the visible name. */
  alt?: string;
  className?: string;
}

export { flagImageSrc };

/**
 * Unified team/country flag. National teams and bare country codes render the api-sports
 * country flag (`flags/{cc}.svg`, all 640×480 = 4:3) in a 4:3 box; clubs render their square
 * crest; otherwise the inline fallback shield. Competition/league logos are NOT flags — use
 * `CompetitionLogo` / `TeamMark variant="competition"` for those.
 */
export function Flag({
  countryCode,
  logoUrl,
  logoStatus,
  teamId,
  isNational,
  size = 16,
  label,
  name,
  shortName,
  code,
  primary,
  secondary,
  alt = '',
  className,
}: FlagProps) {
  const resolved = resolveTeamLogo(teamId, logoUrl ?? null, logoStatus);
  const crestReady = flagImageSrc({
    countryCode,
    logoUrl: resolved,
    isNational,
    logoStatus: resolved ? 'ok' : logoStatus,
  });
  const asFlag = !!crestReady && /media\.api-sports\.io\/flags\//.test(crestReady);
  const width = size;
  const height = asFlag ? Math.round((size * 3) / 4) : size;

  return (
    <span style={{ width, height, display: 'inline-flex' }} className={cn('shrink-0', className)}>
      <TeamMark
        src={resolved}
        status={resolved ? 'ok' : logoStatus}
        teamId={teamId}
        countryCode={countryCode}
        isNational={isNational}
        size={size}
        alt={alt}
        className={cn(
          'h-full w-full object-contain',
          asFlag && 'rounded-sm ring-1 ring-border-subtle/40',
        )}
        name={name}
        shortName={shortName}
        code={code ?? (label && label.length <= 3 ? label : null)}
        primary={primary}
        secondary={secondary}
        style={{ width: '100%', height: '100%' }}
      />
      {/* Keep a visually hidden hint when we only have a raw label and no name. */}
      {!crestReady && !name && label && label.length > 3 ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </span>
  );
}
