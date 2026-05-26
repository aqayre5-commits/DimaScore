import { useTranslations } from 'next-intl';
import { getMatchState, isLive as isLiveStatus } from '@/lib/match-status';
import type { FixtureWithCompetition } from '@/lib/db/queries/team';
import type { Locale } from '@/lib/i18n/config';

interface TeamMatchesListProps {
  fixtures: FixtureWithCompetition[];
  locale: Locale;
}

function resolveTeamName(
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

function formatMatchDate(date: Date): string {
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

function formatMatchTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function TeamMatchesList({ fixtures, locale }: TeamMatchesListProps) {
  const t = useTranslations('teamPage');

  if (fixtures.length === 0) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-surface px-4 py-8 text-center">
        <p className="text-sm text-text-tertiary">{t('noMatchesData')}</p>
      </div>
    );
  }

  const live: FixtureWithCompetition[] = [];
  const upcoming: FixtureWithCompetition[] = [];
  const completed: FixtureWithCompetition[] = [];

  for (const f of fixtures) {
    const state = getMatchState(f.statusCode, f.kickoffAt);
    if (state === 'live') live.push(f);
    else if (state === 'upcoming') upcoming.push(f);
    else completed.push(f);
  }

  // Completed: most recent first
  completed.reverse();

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-surface overflow-hidden">
      <div className="border-b border-border-subtle px-4 py-3">
        <h3 className="label-caps">{t('matches')}</h3>
      </div>
      <div className="divide-y divide-border-subtle/40">
        {live.length > 0 && (
          <MatchSection label={t('live')} fixtures={live} locale={locale} isLive />
        )}
        {upcoming.length > 0 && (
          <MatchSection label={t('upcoming')} fixtures={upcoming} locale={locale} />
        )}
        {completed.length > 0 && (
          <MatchSection label={t('completed')} fixtures={completed} locale={locale} />
        )}
      </div>
    </div>
  );
}

function MatchSection({
  label,
  fixtures,
  locale,
  isLive = false,
}: {
  label: string;
  fixtures: FixtureWithCompetition[];
  locale: Locale;
  isLive?: boolean;
}) {
  const groups: {
    comp: FixtureWithCompetition['competition'];
    matches: FixtureWithCompetition[];
  }[] = [];
  let lastCompId: number | null = null;

  for (const f of fixtures) {
    const compId = f.competition?.id ?? null;
    if (compId !== lastCompId) {
      groups.push({ comp: f.competition, matches: [f] });
      lastCompId = compId;
    } else {
      groups[groups.length - 1].matches.push(f);
    }
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-1.5 py-2">
        {isLive && (
          <span className="inline-block size-1.5 rounded-full bg-accent-crimson live-pulse" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green">
          {label}
        </span>
        <span className="text-[10px] text-text-tertiary">({fixtures.length})</span>
      </div>
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.comp && <CompDivider comp={group.comp} locale={locale} />}
          {group.matches.map((f) => (
            <MatchRow key={f.id} fixture={f} locale={locale} />
          ))}
        </div>
      ))}
    </div>
  );
}

function CompDivider({
  comp,
  locale,
}: {
  comp: NonNullable<FixtureWithCompetition['competition']>;
  locale: Locale;
}) {
  const name = comp.name[locale] ?? comp.name['en'] ?? '\u2014';
  return (
    <div className="flex items-center gap-1.5 py-1.5 text-[10px] text-text-tertiary">
      {comp.logoUrl && (
        <img
          src={comp.logoUrl}
          alt=""
          width={14}
          height={14}
          className="size-3.5 object-contain opacity-70"
          loading="lazy"
        />
      )}
      <span className="truncate font-medium">{name}</span>
    </div>
  );
}

function MatchRow({ fixture: f, locale }: { fixture: FixtureWithCompetition; locale: Locale }) {
  const state = getMatchState(f.statusCode, f.kickoffAt);
  const isLive = state === 'live';
  const isDone = state === 'finished';
  const hasScore = f.homeScore != null && f.awayScore != null;
  const showScore = (isDone || isLive) && hasScore;
  const hGoals = f.homeScore;
  const aGoals = f.awayScore;
  const hWin = hasScore && hGoals! > aGoals!;
  const aWin = hasScore && aGoals! > hGoals!;

  return (
    <a
      href={`/${locale}/match/${f.id}`}
      className="flex items-center gap-0 rounded-lg py-1.5 text-xs transition-colors hover:bg-bg-surface-2"
    >
      {/* Date */}
      <div className="w-10 shrink-0 text-center text-[10px] leading-tight text-text-tertiary tabular-nums">
        {formatMatchDate(f.kickoffAt)}
      </div>

      {/* Teams */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          {f.homeTeam?.logoUrl && (
            <img
              src={f.homeTeam.logoUrl}
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0 object-contain"
              loading="lazy"
            />
          )}
          <span
            className={`flex-1 truncate text-[12px] ${hWin && isDone ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
          >
            {resolveTeamName(f.homeTeam, locale)}
          </span>
          {showScore && (
            <span
              className={`w-5 text-end text-[12px] font-bold tabular-nums ${hWin ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              {hGoals}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {f.awayTeam?.logoUrl && (
            <img
              src={f.awayTeam.logoUrl}
              alt=""
              width={14}
              height={14}
              className="size-3.5 shrink-0 object-contain"
              loading="lazy"
            />
          )}
          <span
            className={`flex-1 truncate text-[12px] ${aWin && isDone ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}
          >
            {resolveTeamName(f.awayTeam, locale)}
          </span>
          {showScore && (
            <span
              className={`w-5 text-end text-[12px] font-bold tabular-nums ${aWin ? 'text-text-primary' : 'text-text-tertiary'}`}
            >
              {aGoals}
            </span>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="w-10 shrink-0 text-center text-[10px] font-semibold">
        {isLive ? (
          <span className="text-accent-crimson">
            {isLiveStatus(f.statusCode) ? f.statusCode : 'LIVE'}
          </span>
        ) : isDone ? (
          <span className="text-text-tertiary">
            {hasScore ? 'FT' : formatMatchTime(f.kickoffAt)}
          </span>
        ) : (
          <span className="text-text-secondary tabular-nums">{formatMatchTime(f.kickoffAt)}</span>
        )}
      </div>
    </a>
  );
}
