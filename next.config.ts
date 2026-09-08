import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

// Self-hosted Soketi (Railway) speaks the Pusher protocol over its own host. Allow that host in the
// CSP connect-src, driven by the same env var the client uses; degrades safely when unset.
const realtimeHost = process.env.NEXT_PUBLIC_PUSHER_HOST;
const realtimeSrc = realtimeHost ? ` https://${realtimeHost} wss://${realtimeHost}` : '';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://media.api-sports.io https://media-4.api-sports.io https://i.ytimg.com https://img.youtube.com https://res.cloudinary.com https://www.facebook.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com data:",
      'frame-src https://www.youtube.com https://www.googletagmanager.com',
      `connect-src 'self'${realtimeSrc} https://connect.facebook.net https://www.facebook.com https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com`,
      "font-src 'self' https://fonts.gstatic.com",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  // Build id baked into the bundle (server + client) for the update-banner version check.
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'dev',
  },
  cacheComponents: true,
  cacheLife: {
    match: { revalidate: 30, expire: 3600 },
    // Shared league-season lookup — short so AR/EN/FR static routes cannot pin a finished year.
    season: { stale: 0, revalidate: 60, expire: 300 },
  },
  experimental: {
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      { hostname: 'media.api-sports.io' },
      { hostname: 'media-*.api-sports.io' },
      { hostname: 'img.youtube.com' },
      { hostname: 'i.ytimg.com' },
      { hostname: 'res.cloudinary.com' },
    ],
  },
  async redirects() {
    return [
      // Legacy season query param → path segment (season moved off searchParams
      // so the default competition page can be statically prerendered).
      {
        source: '/:locale/competition/:country/:tournament',
        has: [{ type: 'query', key: 'season', value: '(?<season>\\d{4})' }],
        destination: '/:locale/competition/:country/:tournament/:season',
        permanent: false,
      },
      // FR SEO alias → canonical Lions Abroad hub
      {
        source: '/fr/joueurs-marocains-a-letranger',
        destination: '/fr/lions-abroad',
        permanent: true,
      },
      // IMP-006: Botola 2026/27 season-opener — FR alias + wrong-locale slugs
      {
        source: '/fr/reprise-botola-pro-2026-2027',
        destination: '/fr/calendrier-botola-pro-2026-2027',
        permanent: true,
      },
      {
        source: '/en/calendrier-botola-pro-2026-2027',
        destination: '/en/botola-pro-2026-27-calendar',
        permanent: true,
      },
      {
        source: '/fr/botola-pro-2026-27-calendar',
        destination: '/fr/calendrier-botola-pro-2026-2027',
        permanent: true,
      },
      {
        source: '/ar/botola-pro-2026-27-calendar',
        destination: '/ar/calendrier-botola-pro-2026-2027',
        permanent: true,
      },
      // IMP-008: Botola classement-primary — wrong-locale slugs
      {
        source: '/en/classement-botola-pro',
        destination: '/en/botola-pro-standings',
        permanent: true,
      },
      {
        source: '/fr/botola-pro-standings',
        destination: '/fr/classement-botola-pro',
        permanent: true,
      },
      {
        source: '/ar/botola-pro-standings',
        destination: '/ar/classement-botola-pro',
        permanent: true,
      },
      // Botola 2 classement-primary — wrong-locale slugs
      {
        source: '/en/classement-botola-2',
        destination: '/en/botola-2-standings',
        permanent: true,
      },
      {
        source: '/fr/botola-2-standings',
        destination: '/fr/classement-botola-2',
        permanent: true,
      },
      {
        source: '/ar/botola-2-standings',
        destination: '/ar/classement-botola-2',
        permanent: true,
      },
      // IMP-010: Botola Pro matchs / live-scores — query alias + wrong-locale slugs
      {
        source: '/fr/matchs-de-botola',
        destination: '/fr/matchs-botola-pro',
        permanent: true,
      },
      {
        source: '/ar/matchs-de-botola',
        destination: '/ar/matchs-botola-pro',
        permanent: true,
      },
      {
        source: '/en/matchs-de-botola',
        destination: '/en/botola-pro-matches',
        permanent: true,
      },
      {
        source: '/en/matchs-botola-pro',
        destination: '/en/botola-pro-matches',
        permanent: true,
      },
      {
        source: '/fr/botola-pro-matches',
        destination: '/fr/matchs-botola-pro',
        permanent: true,
      },
      {
        source: '/ar/botola-pro-matches',
        destination: '/ar/matchs-botola-pro',
        permanent: true,
      },
      {
        source: '/en/botola-pro-fixtures',
        destination: '/en/botola-pro-matches',
        permanent: true,
      },
      {
        source: '/fr/botola-pro-fixtures',
        destination: '/fr/matchs-botola-pro',
        permanent: true,
      },
      {
        source: '/ar/botola-pro-fixtures',
        destination: '/ar/matchs-botola-pro',
        permanent: true,
      },
      // BUG-016: /competition/uefa/ucl → canonical champions-league slug
      {
        source: '/:locale/competition/:country/ucl',
        destination: '/:locale/competition/:country/champions-league',
        permanent: true,
      },
      {
        source: '/:locale/competition/:country/ucl/:season',
        destination: '/:locale/competition/:country/champions-league/:season',
        permanent: true,
      },
      // dimascore.ma is the primary domain — served directly (no redirect).
      // www.dimascore.ma → apex (canonical, no www)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dimascore.ma' }],
        destination: 'https://dimascore.ma/:path*',
        permanent: true,
      },
      // dimascore.com is the doorway → redirect to the primary .ma, path preserved
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dimascore.com' }],
        destination: 'https://dimascore.ma/:path*',
        permanent: true,
      },
      // www.dimascore.com → dimascore.ma
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dimascore.com' }],
        destination: 'https://dimascore.ma/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dimascore.ma';
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: baseUrl },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
