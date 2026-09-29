'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useConsent } from '@/lib/consent';

const PIXEL_ID = '1671058513950399';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Meta (Facebook/Instagram) Pixel, gated on cookie consent.
 *
 * Nothing loads until consent === 'granted'. Once granted, the inline init fires the first PageView
 * and the effect fires PageView on client-side route changes (SPA navigations aren't full loads).
 * The first effect run is skipped so the initial PageView isn't double-counted.
 *
 * The <noscript> pixel fallback is intentionally omitted — it cannot be consent-gated.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const consent = useConsent();
  const granted = consent === 'granted';
  const firstRun = useRef(true);

  useEffect(() => {
    if (!granted) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [pathname, granted]);

  if (!granted) return null;

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  );
}
