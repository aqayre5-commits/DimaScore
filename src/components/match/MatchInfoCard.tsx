import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, MapPin, Users, Shield, Scale } from 'lucide-react';
import { codeToFlag } from '@/lib/flags';
import type { MatchDetail } from '@/lib/db/queries/match-detail';
import type { Locale } from '@/lib/i18n/config';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';

interface MatchInfoCardProps {
  match: MatchDetail;
  locale: Locale;
  competitionHref?: string | null;
}

export function MatchInfoCard({ match, locale, competitionHref }: MatchInfoCardProps) {
  const t = useTranslations('matchDetail');

  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );

  const kickoff = match.kickoffAt;
  const dateStr = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(kickoff);

  const timeStr = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(kickoff);

  const venue = match.venue;
  const stadiumStr = venue ? [venue.name, venue.city].filter(Boolean).join(', ') : null;

  const rows: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: React.ReactNode;
  }> = [
    {
      icon: Shield,
      label: t('competition'),
      value: (() => {
        const flag = match.competition.countryCode
          ? codeToFlag(match.competition.countryCode)
          : null;
        const label = flag ? (
          <>
            <span className="text-lg">{flag}</span> {compName}
          </>
        ) : (
          compName
        );
        return competitionHref ? (
          <Link href={competitionHref} className="text-accent-azure hover:underline">
            {label}
          </Link>
        ) : (
          label
        );
      })(),
    },
    {
      icon: Calendar,
      label: t('date'),
      value: dateStr,
    },
    {
      icon: Clock,
      label: t('kickOff'),
      value: timeStr,
    },
  ];

  if (stadiumStr) {
    rows.push({
      icon: MapPin,
      label: t('stadium'),
      value: stadiumStr,
    });
  }

  if (venue?.capacity) {
    rows.push({
      icon: Users,
      label: t('capacity'),
      value: venue.capacity.toLocaleString(locale),
    });
  }

  if (match.referee) {
    rows.push({
      icon: Scale,
      label: t('referee'),
      value: match.referee,
    });
  }

  if (match.round) {
    rows.push({
      icon: Shield,
      label: t('round'),
      value: match.round,
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="border-b border-border-subtle bg-bg-surface-2 px-4 py-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-accent-green">
          {t('matchInfo')}
        </h3>
      </div>
      <div className="divide-y divide-border-subtle">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-2.5">
            <row.icon className="mt-0.5 size-3.5 shrink-0 text-text-tertiary" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                {row.label}
              </p>
              <p className="text-sm text-text-primary">{row.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
