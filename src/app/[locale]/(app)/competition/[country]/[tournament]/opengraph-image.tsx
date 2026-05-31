import { ImageResponse } from 'next/og';
import { db } from '@/lib/db/client';
import { getCompetitionById } from '@/lib/db/queries/league';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { ALL_ENTRIES } from '@/lib/constants/competitions-mega-menu';

export const runtime = 'edge';
export const alt = 'Competition — DimaScore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}) {
  const { locale, tournament: rawTournament } = await params;
  const tournament = decodeURIComponent(rawTournament);

  let compName = tournament.replace(/-/g, ' ');
  let logoUrl: string | null = null;

  // Resolve competition from mega-menu slug lookup
  const entry =
    ALL_ENTRIES.find((e) => e.slugs[locale as keyof typeof e.slugs] === tournament) ??
    ALL_ENTRIES.find((e) => Object.values(e.slugs).some((s) => s === tournament));

  if (entry) {
    const competition = await getCompetitionById(db, entry.competitionId);
    if (competition) {
      compName = getLocalizedCompetitionName(
        { id: competition.id, name: competition.name, slug: competition.slug },
        locale,
      );
      logoUrl = competition.logoUrl;
    }
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2128 100%)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #00a87f 0%, #3a56d4 100%)',
        }}
      />

      {/* Competition logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          width={120}
          height={120}
          style={{ objectFit: 'contain', marginBottom: 24 }}
        />
      )}

      {/* Competition name */}
      <p
        style={{
          fontSize: 48,
          fontWeight: 800,
          color: '#e6edf3',
          textAlign: 'center',
          maxWidth: 900,
          lineHeight: 1.2,
        }}
      >
        {compName}
      </p>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 22,
          color: '#8b96a9',
          marginTop: 16,
          textTransform: 'uppercase',
          letterSpacing: 3,
        }}
      >
        {locale === 'ar'
          ? 'إحصائيات ونتائج'
          : locale === 'fr'
            ? 'Stats et Classements'
            : 'Stats & Standings'}
      </p>

      {/* Branding */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          display: 'flex',
          alignItems: 'baseline',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 700, color: '#e6edf3' }}>Dima</span>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#3a56d4' }}>Score</span>
      </div>
    </div>,
    { ...size },
  );
}
