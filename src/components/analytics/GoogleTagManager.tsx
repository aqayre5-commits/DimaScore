import Script from 'next/script';

const GTM_ID = 'GTM-MQN45393';

/**
 * Google Tag Manager container. GA4 (and, if desired, the Meta Pixel) are configured as tags
 * inside the GTM dashboard — no further code needed here.
 *
 * Kept intentionally static (no usePathname / client hooks): a dynamic hook here would need a
 * <Suspense> boundary to prerender under cacheComponents. SPA page-views are handled by GTM's
 * built-in History Change trigger (enabled in the GTM UI), so no route-change code is required.
 *
 * NOTE: loads on every page with no consent gate — interim, same as the Meta Pixel. A cookie-
 * consent gate is tracked in BACKLOG.md (GDPR / Loi 09-08).
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
