import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'DimaScore';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const tagline =
    locale === 'ar'
      ? 'كرة القدم المغربية وما بعدها'
      : locale === 'fr'
        ? 'Le football marocain et au-delà'
        : 'Moroccan football and beyond';

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

      {/* Logo text */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#e6edf3' }}>Dima</span>
        <span style={{ fontSize: 72, fontWeight: 700, color: '#3a56d4' }}>Score</span>
      </div>

      {/* Tagline */}
      <p
        style={{
          fontSize: 28,
          color: '#8b96a9',
          marginTop: 16,
          fontWeight: 500,
        }}
      >
        {tagline}
      </p>

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
        <span style={{ fontSize: 16, color: '#627080', fontWeight: 600, letterSpacing: 2 }}>
          LIVE SCORES & STATS
        </span>
      </div>
    </div>,
    { ...size },
  );
}
