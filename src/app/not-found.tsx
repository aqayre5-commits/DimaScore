import Link from 'next/link';

/**
 * Root not-found for locale-less paths (e.g. /typo, bot/old links with no /fr|/en|/ar prefix).
 * These never reach the [locale] tree, so they cannot use next-intl; this is a self-contained,
 * branded fallback that points at each locale's home. Paths under a valid locale get the fully
 * localized [locale]/not-found.tsx via the [locale]/[...rest] catch-all instead.
 *
 * There is no root app/layout.tsx, so this renders its own <html>/<body> with inline styles
 * (the app's Tailwind/tokens are imported in [locale]/layout.tsx, not here).
 */
export default function RootNotFound() {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
          padding: '1rem',
          textAlign: 'center',
          background: '#0d1117',
          color: '#e6edf3',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <span style={{ color: '#4361ee', fontSize: '3.5rem', fontWeight: 700 }}>404</span>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>DimaScore</h1>
        <p style={{ color: '#9aa7b4', fontSize: '0.95rem', margin: 0 }}>
          Page introuvable · Page not found · الصفحة غير موجودة
        </p>
        <div
          style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}
        >
          <Link
            href="/fr"
            style={{
              background: '#4361ee',
              color: '#fff',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Accueil
          </Link>
          <Link
            href="/en"
            style={{
              border: '1px solid #2d3748',
              color: '#e6edf3',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Home
          </Link>
          <Link
            href="/ar"
            style={{
              border: '1px solid #2d3748',
              color: '#e6edf3',
              borderRadius: '0.5rem',
              padding: '0.625rem 1.25rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            الرئيسية
          </Link>
        </div>
      </body>
    </html>
  );
}
