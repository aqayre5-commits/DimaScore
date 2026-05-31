import { ImageResponse } from 'next/og';
import { db } from '@/lib/db/client';
import { getMatchDetail } from '@/lib/db/queries/match-detail';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';

export const runtime = 'edge';
export const alt = 'Match — DimaScore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FINISHED_CODES = new Set(['FT', 'AET', 'PEN']);

export default async function OGImage({
  params,
}: {
  params: Promise<{ locale: string; slug: string[] }>;
}) {
  const { locale, slug } = await params;
  const fixtureId = Number(slug[0]);

  if (!fixtureId || !Number.isFinite(fixtureId)) {
    return fallback();
  }

  const match = await getMatchDetail(db, fixtureId);
  if (!match) return fallback();

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );
  const isFinished = FINISHED_CODES.has(match.statusCode);
  const hasScore = match.homeScore != null && match.awayScore != null;

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

      {/* Competition */}
      <p
        style={{
          fontSize: 22,
          fontWeight: 600,
          color: '#8b96a9',
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginBottom: 24,
        }}
      >
        {compName}
        {match.round ? ` — ${match.round}` : ''}
      </p>

      {/* Teams row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 40,
        }}
      >
        {/* Home */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: 300,
          }}
        >
          {match.homeTeam?.logoUrl && (
            <img
              src={match.homeTeam.logoUrl}
              width={96}
              height={96}
              style={{ objectFit: 'contain', marginBottom: 12 }}
            />
          )}
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#e6edf3',
              textAlign: 'center',
            }}
          >
            {home}
          </span>
        </div>

        {/* Score or VS */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {isFinished && hasScore ? (
            <span style={{ fontSize: 64, fontWeight: 800, color: '#e6edf3' }}>
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span style={{ fontSize: 56, fontWeight: 800, color: '#3a56d4' }}>VS</span>
          )}
          {isFinished && (
            <span style={{ fontSize: 18, color: '#627080', fontWeight: 600, marginTop: 4 }}>
              {match.statusCode === 'AET'
                ? 'After Extra Time'
                : match.statusCode === 'PEN'
                  ? 'Penalties'
                  : 'Full Time'}
            </span>
          )}
        </div>

        {/* Away */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: 300,
          }}
        >
          {match.awayTeam?.logoUrl && (
            <img
              src={match.awayTeam.logoUrl}
              width={96}
              height={96}
              style={{ objectFit: 'contain', marginBottom: 12 }}
            />
          )}
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#e6edf3',
              textAlign: 'center',
            }}
          >
            {away}
          </span>
        </div>
      </div>

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

function fallback() {
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#e6edf3' }}>Dima</span>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#3a56d4' }}>Score</span>
      </div>
      <p style={{ fontSize: 28, color: '#8b96a9', marginTop: 16 }}>Match Details</p>
    </div>,
    { ...size },
  );
}
