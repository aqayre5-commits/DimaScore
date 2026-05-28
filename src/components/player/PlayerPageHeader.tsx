import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { codeToFlag } from '@/lib/flags';
import { getMatchState } from '@/lib/match-status';
import { RatingSparkline } from '@/components/shared/FormSparkline';
import type { PlayerDetail } from '@/lib/db/queries/player';
import type { FixtureWithCompetition } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface PlayerPageHeaderProps {
  player: PlayerDetail;
  locale: Locale;
  nextMatch: FixtureWithCompetition | null;
  lastRatings?: number[];
}

function resolvePlayerName(player: PlayerDetail, locale: Locale): string {
  return (
    player.name[locale] ??
    player.name['en'] ??
    [player.firstname, player.lastname].filter(Boolean).join(' ') ??
    '—'
  );
}

function computeAge(birthDate: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const POSITION_COLORS: Record<string, string> = {
  Attacker: 'bg-accent-crimson/15 text-accent-crimson',
  Midfielder: 'bg-accent-green/15 text-accent-green',
  Defender: 'bg-accent-azure/15 text-accent-azure',
  Goalkeeper: 'bg-accent-amber/15 text-accent-amber',
};

function positionLabel(position: string | null, t: ReturnType<typeof useTranslations>): string {
  switch (position) {
    case 'Goalkeeper':
      return t('goalkeeper');
    case 'Defender':
      return t('defender');
    case 'Midfielder':
      return t('midfielder');
    case 'Attacker':
      return t('attacker');
    default:
      return position ?? '—';
  }
}

function resolveShortName(
  team: {
    name: Record<string, string>;
    shortName: Record<string, string>;
    code: string | null;
  } | null,
  locale: Locale,
): string {
  if (!team) return '\u2014';
  return (
    team.shortName[locale] ??
    team.shortName['en'] ??
    team.name[locale] ??
    team.name['en'] ??
    team.code ??
    '\u2014'
  );
}

function formatCardDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(2);
  return `${d}/${m}/${y}`;
}

function formatCardTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function PlayerPageHeader({
  player,
  locale,
  nextMatch,
  lastRatings,
}: PlayerPageHeaderProps) {
  const t = useTranslations('playerPage');
  const name = resolvePlayerName(player, locale);
  const age = computeAge(player.birthDate);
  const flag = player.nationalityCode ? codeToFlag(player.nationalityCode) : null;
  const clubName = player.currentTeam
    ? (player.currentTeam.name[locale] ??
      player.currentTeam.name['en'] ??
      player.currentTeam.code ??
      '—')
    : null;
  const posBadgeColor =
    POSITION_COLORS[player.position ?? ''] ?? 'bg-bg-surface-2 text-text-secondary';

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {/* Left: photo + identity */}
        <div className="flex flex-1 items-start gap-5">
          {/* Player photo */}
          <div className="size-[100px] shrink-0 overflow-hidden rounded-full border-[3px] border-border-subtle bg-bg-surface-2">
            {player.photoUrl ? (
              <img
                src={player.photoUrl}
                alt={name}
                width={100}
                height={100}
                className="size-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-3xl text-text-tertiary">
                &#128100;
              </div>
            )}
          </div>

          {/* Identity */}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold leading-tight text-text-primary">
              {name}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-text-secondary">
              <span
                className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${posBadgeColor}`}
              >
                {positionLabel(player.position, t)}
              </span>
              {flag && <span>{flag}</span>}
              {player.nationalityCode && <span>{player.nationalityCode}</span>}
              {age != null && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span>
                    {t('age')}: {age}
                  </span>
                </>
              )}
              {player.shirtNumber != null && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span>#{player.shirtNumber}</span>
                </>
              )}
            </div>

            <div className="mt-2 flex items-center gap-3">
              {clubName && (
                <div className="inline-flex items-center gap-1.5 rounded-md bg-bg-surface-2 px-2.5 py-1 text-[13px] font-medium text-text-primary">
                  {player.currentTeam?.logoUrl && (
                    <img
                      src={player.currentTeam.logoUrl}
                      alt=""
                      width={20}
                      height={20}
                      className="size-5 object-contain"
                      loading="eager"
                    />
                  )}
                  <span>{clubName}</span>
                </div>
              )}
              {lastRatings && lastRatings.length > 0 && (
                <div className="flex items-center gap-1.5 rounded-md bg-bg-surface-2 px-2 py-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                    {t('rating')}
                  </span>
                  <RatingSparkline ratings={lastRatings} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: next match card */}
        {nextMatch && (
          <div className="shrink-0">
            <HeaderMatchCard fixture={nextMatch} label={t('nextMatch')} locale={locale} />
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderMatchCard({
  fixture,
  label,
  locale,
}: {
  fixture: FixtureWithCompetition;
  label: string;
  locale: Locale;
}) {
  const state = getMatchState(fixture.statusCode, fixture.kickoffAt);
  const isDone = state === 'finished';
  const isLive = state === 'live';
  const hasScore = fixture.homeScore != null && fixture.awayScore != null;

  const compName = fixture.competition
    ? (fixture.competition.name[locale] ?? fixture.competition.name['en'] ?? '')
    : '';

  const homeName = resolveShortName(fixture.homeTeam, locale);
  const awayName = resolveShortName(fixture.awayTeam, locale);

  return (
    <Link
      href={`/${locale}/match/${fixture.id}`}
      className="flex w-[180px] flex-col rounded-lg border border-border-subtle bg-bg-surface-2 p-2.5 transition-colors hover:bg-bg-surface-3"
    >
      {/* Label */}
      <span className="text-[9px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </span>

      {/* Competition */}
      <div className="mt-1 flex items-center gap-1">
        {fixture.competition?.logoUrl && (
          <img
            src={fixture.competition.logoUrl}
            alt=""
            className="size-3 shrink-0 object-contain"
            loading="lazy"
          />
        )}
        <span className="truncate text-[10px] text-text-tertiary">{compName}</span>
      </div>

      {/* Date + status */}
      <div className="mt-1.5 flex items-center gap-1 text-[10px] tabular-nums text-text-tertiary">
        <span>{formatCardDate(fixture.kickoffAt)}</span>
        <span className="text-text-tertiary">/</span>
        {isLive ? (
          <span className="flex items-center gap-0.5 font-semibold text-accent-emerald">
            <span className="size-1 animate-pulse rounded-full bg-accent-emerald" />
            {fixture.statusCode === 'HT' ? 'HT' : fixture.statusCode}
          </span>
        ) : isDone ? (
          <span className="font-medium text-text-tertiary">FT</span>
        ) : (
          <span>{formatCardTime(fixture.kickoffAt)}</span>
        )}
      </div>

      {/* Teams + score */}
      <div className="mt-1.5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          {fixture.homeTeam?.logoUrl ? (
            <img
              src={fixture.homeTeam.logoUrl}
              alt=""
              className="size-3.5 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface" />
          )}
          <span className="flex-1 truncate text-[11px] text-text-primary">{homeName}</span>
          {(isDone || isLive) && hasScore && (
            <span
              className={`text-[11px] font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
            >
              {fixture.homeScore}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {fixture.awayTeam?.logoUrl ? (
            <img
              src={fixture.awayTeam.logoUrl}
              alt=""
              className="size-3.5 shrink-0 object-contain"
              loading="lazy"
            />
          ) : (
            <span className="inline-block size-3.5 shrink-0 rounded bg-bg-surface" />
          )}
          <span className="flex-1 truncate text-[11px] text-text-primary">{awayName}</span>
          {(isDone || isLive) && hasScore && (
            <span
              className={`text-[11px] font-bold tabular-nums ${isLive ? 'text-accent-emerald' : 'text-text-primary'}`}
            >
              {fixture.awayScore}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
