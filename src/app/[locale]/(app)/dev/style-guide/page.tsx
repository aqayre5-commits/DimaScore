import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const paletteTokens = [
  { var: '--bg-canvas', hex: '#0B1220', role: 'App background' },
  { var: '--bg-surface', hex: '#111A2E', role: 'Cards, panels' },
  { var: '--bg-surface-2', hex: '#18243D', role: 'Elevated (modals, dropdowns)' },
  { var: '--bg-surface-3', hex: '#1F2D4B', role: 'Table row hover, selected' },
  { var: '--border-subtle', hex: '#1F2D4B', role: '1px row dividers' },
  { var: '--border-strong', hex: '#2A3B5F', role: 'Card borders, section dividers' },
  { var: '--text-primary', hex: '#F5F7FA', role: 'Body text' },
  { var: '--text-secondary', hex: '#A8B3CC', role: 'Meta, timestamps' },
  { var: '--text-tertiary', hex: '#6B7894', role: 'Disabled, captions' },
  { var: '--accent-gold', hex: '#D4A24C', role: 'Primary brand — Saadian gold' },
  { var: '--accent-gold-bright', hex: '#E8B85A', role: 'Hover' },
  { var: '--accent-gold-deep', hex: '#A37D32', role: 'Pressed' },
  { var: '--accent-crimson', hex: '#E8334A', role: 'Morocco red — live, red cards' },
  { var: '--accent-emerald', hex: '#0B6E4F', role: 'Morocco green — wins' },
  { var: '--accent-emerald-bright', hex: '#13A074', role: 'Positive deltas, hover' },
  { var: '--accent-azure', hex: '#3B82C4', role: 'Links, info, UCL zone' },
  { var: '--accent-amber', hex: '#E8A23A', role: 'Europa zone, yellow cards' },
  { var: '--accent-violet', hex: '#9B7FE6', role: 'Conference zone, MOTM' },
  { var: '--score-live', hex: '#FF4D5E', role: 'Live score number' },
  { var: '--score-live-bg', hex: '#2D1419', role: 'Live row tint' },
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

export default function StyleGuidePage() {
  const t = useTranslations('styleGuide');

  return (
    <main className="min-h-screen bg-bg-canvas p-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header + locale switcher */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-accent-gold">{t('title')}</h1>
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
