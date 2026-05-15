import { useTranslations } from 'next-intl';
import { ShareButton } from '@/components/shared/ShareButton';
import type { AboutContent } from '@/lib/constants/about-content';

interface AboutCardProps {
  content: AboutContent;
}

/**
 * About card — long-form keyword-bearing content at page bottom.
 * 6 H2 sections + FAQ accordion using native <details>/<summary>.
 * Per competition-cup.md §11.
 */
export function AboutCard({ content }: AboutCardProps) {
  const t = useTranslations('tournament');

  return (
    <section id="about" className="mt-6 rounded-lg border border-border-subtle bg-bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">
          {content.sections[0]?.heading}
        </h2>
        <ShareButton title={content.sections[0]?.heading ?? 'About'} hash="about" />
      </div>
      {content.sections[0] && (
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">
          {content.sections[0].body}
        </p>
      )}

      {content.sections.slice(1).map((section, i) => (
        <div key={i} className="mt-6">
          <h2 className="text-base font-semibold text-text-primary">{section.heading}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{section.body}</p>
        </div>
      ))}

      {content.faqs.length > 0 && (
        <div id="faq" className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-text-primary">{t('faqTitle')}</h2>
            <ShareButton title={t('faqTitle')} hash="faq" />
          </div>
          <div className="mt-3 divide-y divide-border-subtle">
            {content.faqs.map((faq, i) => (
              <details key={i} className="group py-3">
                <summary className="cursor-pointer text-sm font-medium text-text-primary hover:text-accent-gold">
                  {faq.question}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
