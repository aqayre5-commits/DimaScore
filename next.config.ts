import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' https://media.api-sports.io https://media-4.api-sports.io https://i.ytimg.com https://img.youtube.com https://res.cloudinary.com data:",
      'frame-src https://www.youtube.com',
      "connect-src 'self' https://*.pusher.com wss://*.pusher.com",
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
  experimental: {
    ppr: 'incremental',
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
      // www.dimascore.com → dimascore.com
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dimascore.com' }],
        destination: 'https://dimascore.com/:path*',
        permanent: true,
      },
      // dimascore.ma root → Morocco edition
      {
        source: '/',
        has: [{ type: 'host', value: 'dimascore.ma' }],
        destination: 'https://dimascore.com/fr/edition/maroc',
        permanent: true,
      },
      // dimascore.ma deep links → /fr tree
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'dimascore.ma' }],
        destination: 'https://dimascore.com/fr/:path*',
        permanent: true,
      },
      // www.dimascore.ma root → Morocco edition
      {
        source: '/',
        has: [{ type: 'host', value: 'www.dimascore.ma' }],
        destination: 'https://dimascore.com/fr/edition/maroc',
        permanent: true,
      },
      // www.dimascore.ma deep links → /fr tree
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.dimascore.ma' }],
        destination: 'https://dimascore.com/fr/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dimascore.com';
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
