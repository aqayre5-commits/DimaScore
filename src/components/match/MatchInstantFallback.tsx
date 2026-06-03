'use client';

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query-keys';
import { codeToFlag } from '@/lib/flags';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { LiveScoreDisplay } from '@/components/match/LiveScoreDisplay';
import type { MatchHeaderPreview, MatchHeaderPreviewTeam } from '@/lib/match-header-preview';
import type { Locale } from '@/lib/i18n/config';

/**
 * Center-column content for the match route's loading.tsx.
 *
 * If a fixture surface seeded qk.matchHeader(id) before navigating, paints a
 * real partial header (teams + score via the shared LiveScoreDisplay +
 * competition when available) so the soft-nav first frame is not a gray
 * skeleton. The canonical RSC page replaces it ~150ms later and upgrades the
 * venue/referee/round/goal-scorers. With no preview, degrades to the original
 * shaped header skeleton. The tab strip + sections always skeleton (tabs are
 * never instant in 8A).
 */
export function MatchInstantFallback() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const locale = String(params?.locale ?? 'fr') as Locale;

  // Cache-only read — never fetched over the network (no queryFn, disabled).
  const { data: preview } = useQuery<MatchHeaderPreview>({
    queryKey: qk.matchHeader(id),
    enabled: false,
  });

  return (
    <div className="space-y-4">
      {preview ? <PreviewHeader preview={preview} locale={locale} /> : <HeaderSkeleton />}
      <TabSectionSkeleton />
    </div>
  );
}

function PreviewHeader({ preview, locale }: { preview: MatchHeaderPreview; locale: Locale }) {
  const compName = preview.competition
    ? getLocalizedCompetitionName(
        { id: 0, name: preview.competition.name, slug: preview.competition.slug },
        locale,
      )
    : null;

  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-surface bg-gradient-to-br from-bg-surface from-20% via-blue-500/5 via-50% to-blue-500/15">
      {/* Competition strip — height reserved; name shown when the surface carries it */}
      <div className="border-b border-border-subtle px-4 py-2.5 text-center">
        <p className="text-xs font-medium text-text-secondary">
          {compName ?? <span className="inline-block h-3 w-24 align-middle" />}
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 px-4 py-6">
        <div className="flex w-full items-center justify-center gap-4">
          <TeamSlot team={preview.homeTeam} locale={locale} />

          {/* Reused verbatim from the canonical header → pixel-identical, live-capable */}
          <LiveScoreDisplay
            statusCode={preview.statusCode}
            homeScore={preview.homeScore}
            awayScore={preview.awayScore}
            homeScoreHt={null}
            awayScoreHt={null}
            homeScoreEt={null}
            awayScoreEt={null}
            homeScorePen={null}
            awayScorePen={null}
            minute={preview.minute}
            extraMinute={null}
            kickoffAt={preview.kickoffAt}
            locale={locale}
          />

          <TeamSlot team={preview.awayTeam} locale={locale} />
        </div>

        {/* Info strip space reserved so the RSC upgrade (venue/referee) doesn't jump */}
        <div className="h-4" />
      </div>
    </div>
  );
}

function TeamSlot({ team, locale }: { team: MatchHeaderPreviewTeam | null; locale: Locale }) {
  const name = team ? getTeamDisplayName(team, locale) : 'TBD';
  const flag = team?.isNational && team.countryCode ? codeToFlag(team.countryCode) : null;

  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
      {flag && <span className="text-4xl leading-none">{flag}</span>}
      {!flag && team?.logoUrl && (
        <Image
          src={team.logoUrl}
          alt=""
          className="size-14 object-contain"
          width={56}
          height={56}
        />
      )}
      {!flag && !team?.logoUrl && <div className="size-14 rounded-full bg-bg-surface-2" />}
      <span className="text-base font-semibold text-text-primary">{name}</span>
    </div>
  );
}

function Box({ className }: { className?: string }) {
  return <div className={`rounded bg-bg-surface-2 ${className ?? ''}`} />;
}

function HeaderSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex justify-center border-b border-border-subtle px-4 py-2.5">
        <Box className="h-3 w-32" />
      </div>
      <div className="flex items-center justify-center gap-6 px-4 py-6">
        <div className="flex flex-1 flex-col items-center gap-2">
          <Box className="size-14 rounded-full" />
          <Box className="h-4 w-20" />
        </div>
        <Box className="h-10 w-16 rounded-lg" />
        <div className="flex flex-1 flex-col items-center gap-2">
          <Box className="size-14 rounded-full" />
          <Box className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

function TabSectionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border-subtle bg-bg-surface">
      <div className="flex gap-2 border-b border-border-subtle p-3">
        <Box className="h-7 w-20 rounded-md" />
        <Box className="h-7 w-20 rounded-md" />
        <Box className="h-7 w-20 rounded-md" />
        <Box className="h-7 w-20 rounded-md" />
      </div>
      <div className="space-y-3 p-4">
        <Box className="h-24" />
        <Box className="h-24" />
      </div>
    </div>
  );
}
