'use client';

import { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { LocalTime } from '@/components/shared/LocalTime';
import { LIVE_CODES_ARRAY } from '@/lib/match-status';
import type { LionsAbroadFixture } from '@/lib/db/queries/lions-abroad';
import type { Locale } from '@/lib/i18n/config';

const LIVE = new Set<string>(LIVE_CODES_ARRAY);
const emptySubscribe = () => () => {};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function bucketOf(kickoff: Date, now: Date): 'tonight' | 'weekend' | 'upcoming' {
  const startToday = startOfDay(now);
  const endToday = new Date(startToday);
  endToday.setDate(endToday.getDate() + 1);
  const day = kickoff.getDay(); // 0 Sun … 6 Sat
  const isWeekend = day === 5 || day === 6 || day === 0;
  if (kickoff >= startToday && kickoff < endToday) return 'tonight';
  if (isWeekend && kickoff >= startToday) return 'weekend';
  return 'upcoming';
}

interface Labels {
  live: string;
  tonight: string;
  weekend: string;
  upcoming: string;
  emptyFixtures: string;
  vs: string;
}

interface Props {
  fixtures: LionsAbroadFixture[];
  locale: Locale;
  labels: Labels;
}

export function LionsAbroadFixtures({ fixtures, locale, labels }: Props) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const now = new Date();

  const live: LionsAbroadFixture[] = [];
  const tonight: LionsAbroadFixture[] = [];
  const weekend: LionsAbroadFixture[] = [];
  const upcoming: LionsAbroadFixture[] = [];

  for (const f of fixtures) {
    if (LIVE.has(f.statusCode)) {
      live.push(f);
      continue;
    }
    if (!mounted) {
      upcoming.push(f);
      continue;
    }
    const bucket = bucketOf(new Date(f.kickoffAt), now);
    if (bucket === 'tonight') tonight.push(f);
    else if (bucket === 'weekend') weekend.push(f);
    else upcoming.push(f);
  }

  const sections: { key: string; title: string; rows: LionsAbroadFixture[] }[] = [
    { key: 'live', title: labels.live, rows: live },
    { key: 'tonight', title: labels.tonight, rows: tonight },
    { key: 'weekend', title: labels.weekend, rows: weekend },
    { key: 'upcoming', title: labels.upcoming, rows: upcoming },
  ].filter((s) => s.rows.length > 0);

  if (sections.length === 0) {
    return <p className="text-sm text-text-tertiary">{labels.emptyFixtures}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section key={section.key}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            {section.title}
          </h2>
          <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
            {section.rows.map((f) => (
              <li key={f.id}>
                <Link
                  href={`/${locale}/match/${f.id}`}
                  className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-bg-surface-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-text-primary">
                      {f.homeTeamName} {labels.vs} {f.awayTeamName}
                    </p>
                    <span className="shrink-0 text-sm tabular-nums text-text-secondary">
                      {LIVE.has(f.statusCode) ? (
                        <span className="font-bold text-score-live">
                          {f.minute != null ? `${f.minute}'` : labels.live}
                        </span>
                      ) : (
                        <LocalTime date={f.kickoffAt} locale={locale} format="kickoff" />
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-tertiary">
                    {f.competitionName}
                    {f.players.length > 0
                      ? ` · ${f.players.map((p) => p.playerName).join(', ')}`
                      : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
