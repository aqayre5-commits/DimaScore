import Script from 'next/script';

const GTM_ID = 'GTM-MQN45393';

/**
 * Google Tag Manager container. GA4 (and the Meta Pixel, if desired) are configured as tags inside
 * the GTM dashboard — no further code needed here.
 *
 * Loads unconditionally on every page (no consent gate): a non-blocking cookie notice informs
 * visitors, and tags fire for everyone so GA4 measures all traffic. SPA page-views are handled by
 * GTM's built-in History Change trigger (enabled in the GTM UI), so no route-change code is needed.
 */
export function GoogleTagManager() {
  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
