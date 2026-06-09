'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users, CalendarDays, LayoutGrid } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { formatSeason } from '@/lib/utils/date';
import type { CompetitionRecord } from '@/lib/db/queries/league';
import Image from 'next/image';

/** Curated high-res logos override the low-res API-Football PNGs. */
const CURATED_LOGOS: Record<number, string> = {
  39: '/competitions/premier-league.png',
  2: '/competitions/champions-league.svg',
  6: '/competitions/afcon-trophy.svg',
  61: '/competitions/ligue-1.svg',
  140: '/competitions/la-liga.svg',
  922: '/competitions/wafcon.png',
  202: '/competitions/tunisia-ligue-1.svg',
  203: '/competitions/turkey-super-lig.svg',
};

/** Competition IDs whose API-Football logos are dark artwork that needs
 *  inversion (white) on our dark theme. Curated logos are included. */
const DARK_LOGOS: Set<number> = new Set([
  2, 3, 29, 36, 39, 61, 82, 140, 203, 233, 525, 848, 922, 1, 1191,
]);

/** Sub-nation flag emojis (Unicode tag sequences). */
const SUB_FLAGS: Record<string, string> = {
  'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', // 🏴󠁧󠁢󠁥󠁮󠁧󠁿
  'GB-SCT': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', // 🏴󠁧󠁢󠁳󠁣󠁴󠁿
  'GB-WLS': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}', // 🏴󠁧󠁢󠁷󠁬󠁳󠁿
};

/** Convert country code to flag emoji. Handles ISO 3166-2 sub-codes. */
function countryFlag(code: string | null): string | null {
  if (!code) return null;
  if (SUB_FLAGS[code]) return SUB_FLAGS[code];
  if (code.length !== 2) return null;
  const cp1 = 0x1f1e6 + code.toUpperCase().charCodeAt(0) - 65;
  const cp2 = 0x1f1e6 + code.toUpperCase().charCodeAt(1) - 65;
  return String.fromCodePoint(cp1, cp2);
}

interface LeaguePageHeaderProps {
  competition: CompetitionRecord;
  seasonYear: number;
  locale: Locale;
  countryName: string | null;
  introText: string | null;
  availableSeasons: { year: number; isCurrent: boolean }[];
  teamsCount?: number;
  matchesCount?: number;
  totalRounds?: number;
  currentRound?: number | null;
}

export function LeaguePageHeader({
  competition,
  seasonYear,
  locale,
  countryName,
  introText,
  availableSeasons,
  teamsCount,
  matchesCount,
  totalRounds,
  currentRound,
}: LeaguePageHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('leaguePage');
  const name = competition.name[locale] ?? competition.name['en'] ?? competition.slug;
  const logoSrc = CURATED_LOGOS[competition.id] ?? competition.logoUrl;
  const needsInvert = DARK_LOGOS.has(competition.id);

  function handleSeasonChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = e.target.value;
    const currentSeason = availableSeasons.find((s) => s.isCurrent);
    // Strip any trailing /YYYY season segment to get the base competition path.
    const basePath = pathname.replace(/\/\d{4}$/, '');
    if (currentSeason && Number(year) === currentSeason.year) {
      router.push(basePath);
    } else {
      router.push(`${basePath}/${year}`);
    }
  }

  const stats = [
    ...(teamsCount && teamsCount > 0
      ? [{ icon: Users, value: teamsCount, label: t('teamsCount') }]
      : []),
    ...(matchesCount && matchesCount > 0
      ? [{ icon: CalendarDays, value: matchesCount, label: t('matchesCount') }]
      : []),
    ...(totalRounds && totalRounds > 0
      ? [
          {
            icon: LayoutGrid,
            value:
              currentRound && currentRound < totalRounds
                ? `${currentRound}/${totalRounds}`
                : totalRounds,
            label: t('roundsCount'),
          },
        ]
      : []),
  ];

  // Season control — top-right on desktop; on its own line under the meta on mobile (so it doesn't
  // collide with the title).
  const seasonControl =
    availableSeasons.length > 1 ? (
      <select
        value={seasonYear}
        onChange={handleSeasonChange}
        className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure focus:outline-none focus:ring-1 focus:ring-accent"
      >
        {availableSeasons.map((s) => (
          <option key={s.year} value={s.year}>
            {formatSeason(s.year)}
          </option>
        ))}
      </select>
    ) : (
      <span className="shrink-0 rounded-md bg-accent-azure/15 px-3 py-1 text-xs font-semibold text-accent-azure">
        {formatSeason(seasonYear)}
      </span>
    );

  return (
    <div className="h-full">
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15 p-2 md:min-h-[180px]">
        <div className="relative flex flex-1 items-stretch gap-5">
          {/* Logo — one responsive image; fills the card height on the left and drives the mobile
              height, width-capped so square crests stay sensible. Keeps dark-logo inversion. */}
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt=""
              width={96}
              height={96}
              sizes="(min-width: 768px) 200px, 40vw"
              className={`h-[160px] w-auto max-w-[40%] shrink-0 self-end object-contain object-bottom md:h-full md:max-h-[160px] md:max-w-[200px]${needsInvert ? ' logo-invert' : ''}`}
              priority
            />
          ) : (
            <div className="flex size-24 shrink-0 items-center justify-center self-end rounded-lg bg-bg-surface-2 md:size-32">
              <span className="text-4xl">🏆</span>
            </div>
          )}

          {/* Title + meta + stats */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="font-display text-lg font-semibold text-text-primary md:text-3xl">
                  {name}
                </h1>
                <div className="mt-1.5 flex items-center gap-2">
                  {countryName && (
                    <span className="text-sm text-text-secondary md:text-base">
                      <span className="text-base md:text-lg">
                        {countryFlag(competition.countryCode)}
                      </span>{' '}
                      {countryName}
                    </span>
                  )}
                </div>
                {/* Mobile: season selector on its own line (clears the title) */}
                <div className="mt-2 md:hidden">{seasonControl}</div>
              </div>
              {/* Desktop: season selector top-right */}
              <div className="hidden md:block">{seasonControl}</div>
            </div>

            {/* Stats — desktop only (hidden on mobile); bordered pill row pushed to bottom */}
            {stats.length > 0 && (
              <div className="mt-auto hidden flex-wrap gap-3 md:flex">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center rounded-lg border border-accent-azure/20 bg-accent-azure/5 px-3 py-1.5"
                  >
                    <div className="flex items-center gap-1">
                      <s.icon className="size-3.5 text-accent-azure" />
                      <span className="text-sm font-bold tabular-nums text-text-primary">
                        {s.value}
                      </span>
                    </div>
                    <span className="text-[10px] text-text-tertiary">{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
