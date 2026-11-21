import { db } from '@/lib/db/client';
import { getCompetitionById } from '@/lib/db/queries/league';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { ALL_ENTRIES } from '@/lib/constants/competitions-mega-menu';
import { OG_FONT_FAMILY, OG_SIZE, renderOgImage } from '@/lib/og/og-image';
import { OgText } from '@/lib/og/og-text';

export const alt = 'Competition — DimaScore';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ locale: string; country: string; tournament: string }>;
}) {
  const { locale, tournament: rawTournament } = await params;
  let tournament = rawTournament;
  try {
    tournament = decodeURIComponent(rawTournament);
  } catch {
    // keep the raw segment
  }

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

  const subtitle =
    locale === 'ar'
      ? 'إحصائيات ونتائج'
      : locale === 'fr'
        ? 'Stats et Classements'
        : 'Stats & Standings';

  const image = (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #1c2128 100%)',
        fontFamily: OG_FONT_FAMILY,
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
          alt=""
          width={120}
          height={120}
          style={{ objectFit: 'contain', marginBottom: 24 }}
        />
      )}

      {/* Competition name */}
      <OgText
        text={compName}
        locale={locale}
        style={{
          fontSize: 48,
          color: '#e6edf3',
          textAlign: 'center',
          justifyContent: 'center',
          maxWidth: 900,
          lineHeight: 1.2,
        }}
      />

      {/* Subtitle */}
      <OgText
        text={subtitle}
        locale={locale}
        style={{
          fontSize: 22,
          color: '#8b96a9',
          marginTop: 16,
          textTransform: 'uppercase',
          letterSpacing: 3,
        }}
      />

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
        <span style={{ fontSize: 24, color: '#e6edf3' }}>Dima</span>
        <span style={{ fontSize: 24, color: '#3a56d4' }}>Score</span>
      </div>
    </div>
  );

  return renderOgImage(image, brandOnly());
}

function brandOnly() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        paddingTop: 260,
        gap: 4,
        background: '#0d1117',
        fontFamily: OG_FONT_FAMILY,
      }}
    >
      <span style={{ fontSize: 72, color: '#e6edf3' }}>Dima</span>
      <span style={{ fontSize: 72, color: '#3a56d4' }}>Score</span>
    </div>
  );
}
