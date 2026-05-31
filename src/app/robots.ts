import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/constants/site';

const baseUrl = BASE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/dev/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
