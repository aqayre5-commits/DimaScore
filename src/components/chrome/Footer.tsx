import { useTranslations } from 'next-intl';

const legalLinks = [
  { key: 'legalNotice', href: '#' },
  { key: 'privacyPolicy', href: '#' },
  { key: 'contact', href: '#' },
] as const;

export function Footer() {
  const t = useTranslations('footer');
  const tApp = useTranslations('app');
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-bg-surface">
      <div className="flex flex-col gap-6 ps-4 pe-4 py-8 md:flex-row md:items-start md:justify-between md:py-6">
        {/* Logo + tagline */}
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold text-accent-gold">{tApp('name')}</span>
          <span className="text-sm text-text-secondary">{t('tagline')}</span>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap items-center gap-4">
          {legalLinks.map((link) => (
            <a
              key={link.key}
              href={link.href}
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {t(link.key)}
            </a>
          ))}
        </div>

        {/* Loi 09-08 + copyright */}
        <div className="flex max-w-sm flex-col gap-1">
          <p className="text-xs text-text-tertiary">{t('loi0908')}</p>
          <p className="text-xs text-text-tertiary">{t('copyright', { year })}</p>
        </div>
      </div>
    </footer>
  );
}
