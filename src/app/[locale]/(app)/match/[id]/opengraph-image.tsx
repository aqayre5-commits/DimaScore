import { db } from '@/lib/db/client';
import { getMatchDetail } from '@/lib/db/queries/match-detail';
import { getTeamDisplayName } from '@/lib/utils/team-name';
import { getLocalizedCompetitionName } from '@/lib/constants/competition-names-i18n';
import { localizeRound, versusUpper } from '@/lib/i18n/feed-labels';
import { ogFixtureId } from '@/lib/og/og-ids';
import { OG_FONT_FAMILY, OG_SIZE, renderOgImage } from '@/lib/og/og-image';
import { OgText } from '@/lib/og/og-text';

const OG_FINISHED: Record<string, Record<'AET' | 'PEN' | 'FT', string>> = {
  en: { AET: 'After Extra Time', PEN: 'Penalties', FT: 'Full Time' },
  fr: { AET: 'Après prolongation', PEN: 'Tirs au but', FT: 'Terminé' },
  ar: { AET: 'بعد الأشواط الإضافية', PEN: 'ركلات الترجيح', FT: 'نهاية المباراة' },
};
const OG_LIVE: Record<string, string> = { en: 'LIVE', fr: 'EN DIRECT', ar: 'مباشر' };
const OG_FALLBACK: Record<string, string> = {
  en: 'Match details',
  fr: 'Détails du match',
  ar: 'تفاصيل المباراة',
};

function ogFinishedLabel(statusCode: string, locale: string): string {
  const labels = OG_FINISHED[locale] ?? OG_FINISHED.en;
  return statusCode === 'AET' ? labels.AET : statusCode === 'PEN' ? labels.PEN : labels.FT;
}

export const alt = 'Match — DimaScore';
export const size = OG_SIZE;
export const contentType = 'image/png';

const FINISHED_CODES = new Set(['FT', 'AET', 'PEN']);

export default async function OGImage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: rawId } = await params;
  const fixtureId = ogFixtureId(rawId);
  if (!fixtureId) return renderOgImage(fallback(locale), fallback('en'));

  const match = await getMatchDetail(db, fixtureId);
  if (!match) return renderOgImage(fallback(locale), fallback('en'));

  const home = getTeamDisplayName(match.homeTeam, locale);
  const away = getTeamDisplayName(match.awayTeam, locale);
  const compName = getLocalizedCompetitionName(
    { id: match.competition.id, name: match.competition.name, slug: match.competition.slug },
    locale,
  );
  const round = localizeRound(match.groupLabel ?? match.round, locale);
  const isFinished = FINISHED_CODES.has(match.statusCode);
  const hasScore = match.homeScore != null && match.awayScore != null;
  const rtl = locale === 'ar';

  const team = (name: string, logo: string | null | undefined) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 320 }}>
      {logo && (
        <img
          src={logo}
          alt=""
          width={96}
          height={96}
          style={{ objectFit: 'contain', marginBottom: 12 }}
        />
      )}
      <OgText
        text={name}
        locale={locale}
        style={{ fontSize: 30, color: '#e6edf3', textAlign: 'center', justifyContent: 'center' }}
      />
    </div>
  );

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

      <OgText
        text={round ? `${compName} — ${round}` : compName}
        locale={locale}
        style={{
          fontSize: 24,
          color: '#8b96a9',
          textTransform: 'uppercase',
          letterSpacing: 3,
          marginBottom: 28,
          maxWidth: 1000,
          justifyContent: 'center',
        }}
      />

      {/* Home sits on the right on /ar, as on the page. */}
      <div
        style={{
          display: 'flex',
          flexDirection: rtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: 40,
        }}
      >
        {team(home, match.homeTeam?.logoUrl)}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {hasScore ? (
            <span style={{ fontSize: 64, color: '#e6edf3' }}>
              {rtl
                ? `${match.awayScore} - ${match.homeScore}`
                : `${match.homeScore} - ${match.awayScore}`}
            </span>
          ) : (
            <OgText
              text={versusUpper(locale)}
              locale={locale}
              style={{ fontSize: 56, color: '#3a56d4' }}
            />
          )}
          {isFinished && (
            <OgText
              text={ogFinishedLabel(match.statusCode, locale)}
              locale={locale}
              style={{ fontSize: 20, color: '#8b96a9', marginTop: 4 }}
            />
          )}
          {!isFinished && hasScore && (
            <OgText
              text={OG_LIVE[locale] ?? OG_LIVE.en}
              locale={locale}
              style={{ fontSize: 20, color: '#e11d48', marginTop: 4 }}
            />
          )}
        </div>
        {team(away, match.awayTeam?.logoUrl)}
      </div>

      <Brand size={24} />
    </div>
  );

  return renderOgImage(image, fallback(locale));
}

function Brand({ size }: { size: number }) {
  // The wordmark is Latin on every locale (as in the site header).
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
      }}
    >
      <span style={{ fontSize: size, color: '#e6edf3' }}>Dima</span>
      <span style={{ fontSize: size, color: '#3a56d4' }}>Score</span>
    </div>
  );
}

function fallback(locale: string) {
  return (
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 72, color: '#e6edf3' }}>Dima</span>
        <span style={{ fontSize: 72, color: '#3a56d4' }}>Score</span>
      </div>
      <OgText
        text={OG_FALLBACK[locale] ?? OG_FALLBACK.en}
        locale={locale}
        style={{ fontSize: 28, color: '#8b96a9', marginTop: 16 }}
      />
    </div>
  );
}
