import type { MetadataRoute } from 'next';

/** Web App Manifest — served at /manifest.webmanifest. Uses the new /public PWA icons. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DimaScore',
    short_name: 'DimaScore',
    description: 'Moroccan football and beyond',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1117',
    theme_color: '#0d1117',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
