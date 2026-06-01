import type { Metadata } from 'next';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Style Guide (Dev)',
  robots: { index: false, follow: false },
};

const paletteTokens = [
  { var: '--bg-canvas', hex: '#101112', role: 'App background' },
  { var: '--bg-surface', hex: '#1A1D20', role: 'Cards, panels' },
  { var: '--bg-surface-2', hex: '#22262A', role: 'Elevated (modals, dropdowns)' },
  { var: '--bg-surface-3', hex: '#2A2F34', role: 'Table row hover, selected' },
  { var: '--border-subtle', hex: '#31363B', role: '1px row dividers' },
  { var: '--border-strong', hex: '#42484F', role: 'Card borders, section dividers' },
  { var: '--text-primary', hex: '#F5F3EE', role: 'Body text' },
  { var: '--text-secondary', hex: '#D5D9DD', role: 'Meta, timestamps' },
  { var: '--text-tertiary', hex: '#A3ABB2', role: 'Captions, labels' },
  { var: '--accent-green', hex: '#6EBE9C', role: 'Primary brand — accent green' },
  { var: '--accent-green-bright', hex: '#7FC9A7', role: 'Hover' },
  { var: '--accent-green-deep', hex: '#55A889', role: 'Pressed' },
  { var: '--accent-crimson', hex: '#EF4444', role: 'Live, red cards, danger' },
  { var: '--accent-emerald', hex: '#16A765', role: 'Success, wins' },
  { var: '--accent-emerald-bright', hex: '#22C97A', role: 'Positive deltas, hover' },
  { var: '--accent-azure', hex: '#60A5FA', role: 'Links, info, UCL zone' },
  { var: '--accent-amber', hex: '#F59E0B', role: 'Warning, yellow cards' },
  { var: '--accent-violet', hex: '#A78BFA', role: 'Conference zone, MOTM' },
  { var: '--score-live', hex: '#E06A63', role: 'Live score number' },
  { var: '--score-live-bg', hex: '#2D1A1A', role: 'Live row tint' },
];

const typeScale = [
  { name: 'display', class: 'text-5xl font-bold tracking-tight', key: 'display' },
  { name: 'headline', class: 'text-3xl font-semibold tracking-tight', key: 'headline' },
  { name: 'subhead', class: 'text-xl font-medium', key: 'subhead' },
  { name: 'body', class: 'text-base', key: 'body' },
  { name: 'caption', class: 'text-sm text-text-secondary', key: 'caption' },
  { name: 'micro', class: 'text-xs text-text-tertiary', key: 'micro' },
] as const;

const localeLinks = [
  { locale: 'fr', label: 'Français' },
  { locale: 'en', label: 'English' },
  { locale: 'ar', label: 'العربية' },
];

export default async function StyleGuidePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'styleGuide' });

  return (
    <main className="min-h-screen bg-bg-canvas p-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header + locale switcher */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-accent-green">{t('title')}</h1>
          <div className="flex gap-2">
            {localeLinks.map((l) => (
              <Link
                key={l.locale}
                href={`/${l.locale}/dev/style-guide`}
                className="rounded-md border border-border-strong px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ─── Palette ─── */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">{t('palette')}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {paletteTokens.map((token) => (
              <div
                key={token.var}
                className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-surface p-3"
              >
                <div
                  className="h-12 w-12 shrink-0 rounded-md border border-border-strong"
                  style={{ backgroundColor: `var(${token.var})` }}
                />
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-text-primary">{token.var}</p>
                  <p className="font-mono text-xs text-text-tertiary">{token.hex}</p>
                  <p className="truncate text-xs text-text-secondary">{token.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Typography ─── */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">{t('typography')}</h2>
          <div className="space-y-6 rounded-lg border border-border-subtle bg-bg-surface p-6">
            {typeScale.map((step) => (
              <div key={step.key} className="flex items-baseline gap-4">
                <span className="w-24 shrink-0 font-mono text-xs text-text-tertiary">
                  {t(step.key)}
                </span>
                <p className={`${step.class} text-text-primary`}>{t('sampleText')}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Tabular Numerals ─── */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">{t('tabularNumerals')}</h2>
          <div className="rounded-lg border border-border-subtle bg-bg-surface p-6">
            <div className="space-y-2 font-mono text-4xl tabular-nums text-text-primary">
              <p>{t('sampleNumber')}</p>
              <p>90:00 — 3 : 1</p>
              <p>1,440 / 75,000</p>
            </div>
          </div>
        </section>

        {/* ─── UI Primitives ─── */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold text-text-primary">{t('primitives')}</h2>
          <div className="space-y-6 rounded-lg border border-border-subtle bg-bg-surface p-6">
            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
