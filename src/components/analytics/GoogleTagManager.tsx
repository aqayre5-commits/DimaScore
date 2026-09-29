'use client';

import Script from 'next/script';
import { useConsent } from '@/lib/consent';

const GTM_ID = 'GTM-MQN45393';

/**
 * Google Tag Manager container, gated on cookie consent.
 *
 * GA4 (and any other tags) are configured inside the GTM dashboard, so gating GTM gates them too.
 * Nothing loads until consent === 'granted': a fresh/opted-out visitor makes no googletagmanager
 * request. On mount we read stored consent (returning granted visitors load immediately); a live
 * Accept re-renders this via the consent store and injects the script without a reload.
 *
 * The <noscript> iframe fallback is intentionally omitted — it cannot be consent-gated.
 */
export function GoogleTagManager() {
  const consent = useConsent();
  if (consent !== 'granted') return null;

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}
