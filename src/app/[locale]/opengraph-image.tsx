import { OG_FONT_FAMILY, OG_SIZE, renderOgImage } from '@/lib/og/og-image';
import { OgText } from '@/lib/og/og-text';

export const alt = 'DimaScore';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const tagline =
    locale === 'ar'
      ? 'كرة القدم المغربية وما بعدها'
      : locale === 'fr'
        ? 'Le football marocain et au-delà'
        : 'Moroccan football and beyond';

  const footer =
    locale === 'ar'
      ? 'نتائج مباشرة وإحصائيات'
      : locale === 'fr'
        ? 'SCORES EN DIRECT ET STATS'
        : 'LIVE SCORES & STATS';

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

      {/* Logo text */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 72, color: '#e6edf3' }}>Dima</span>
        <span style={{ fontSize: 72, color: '#3a56d4' }}>Score</span>
      </div>

      {/* Tagline */}
      <OgText
        text={tagline}
        locale={locale}
        style={{ fontSize: 28, color: '#8b96a9', marginTop: 16 }}
      />

      {/* Bottom accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: '#00a87f',
          }}
        />
        <OgText
          text={footer}
          locale={locale}
          style={{ fontSize: 16, color: '#627080', letterSpacing: 2 }}
        />
      </div>
    </div>
  );

  return renderOgImage(image, image);
}
