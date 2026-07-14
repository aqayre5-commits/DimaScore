import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://media.api-sports.io https://media-4.api-sports.io https://i.ytimg.com https://img.youtube.com https://res.cloudinary.com https://www.facebook.com data:",
      'frame-src https://www.youtube.com',
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://connect.facebook.net https://www.facebook.com",
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
