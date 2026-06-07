import type { Locale } from '@/lib/i18n/config';

/**
 * Curated About + Honours copy for national teams. Hand-authored (not derived from ingested
 * fixtures, which only cover recent editions) so totals/honours are accurate. Same inline-locale
 * pattern as about-content / league-content. Add a team by id; pages render only when present.
 */
export interface Honour {
  competition: string;
  detail: string;
}

export interface NationalTeamContent {
  about: string;
  honours: Honour[];
}

const REGISTRY: Record<number, Record<Locale, NationalTeamContent>> = {
  // 31 — Morocco (Atlas Lions)
  31: {
    en: {
      about:
        'Morocco — the Atlas Lions — is the national team governed by the FRMF and competing in CAF. At the 2022 World Cup they became the first African and Arab nation to reach the semi-finals.',
      honours: [
        { competition: 'Africa Cup of Nations', detail: 'Winners — 1976' },
        { competition: 'World Cup', detail: 'Fourth place — 2022 (best by an African nation)' },
      ],
    },
    fr: {
      about:
        'Le Maroc — les Lions de l’Atlas — est l’équipe nationale gérée par la FRMF et évoluant au sein de la CAF. À la Coupe du Monde 2022, le Maroc est devenu la première nation africaine et arabe à atteindre les demi-finales.',
      honours: [
        { competition: 'Coupe d’Afrique des Nations', detail: 'Vainqueur — 1976' },
        {
          competition: 'Coupe du Monde',
          detail: 'Quatrième place — 2022 (meilleur résultat d’une nation africaine)',
        },
      ],
    },
    ar: {
      about:
        'المغرب — أسود الأطلس — هو المنتخب الوطني الذي تشرف عليه الجامعة الملكية المغربية لكرة القدم وينافس ضمن الكاف. في كأس العالم 2022 أصبح المغرب أول منتخب إفريقي وعربي يبلغ الدور نصف النهائي.',
      honours: [
        { competition: 'كأس أمم إفريقيا', detail: 'البطل — 1976' },
        { competition: 'كأس العالم', detail: 'المركز الرابع — 2022 (أفضل نتيجة لمنتخب إفريقي)' },
      ],
    },
  },
};

export function getNationalTeamContent(
  teamId: number,
  locale: Locale,
): NationalTeamContent | undefined {
  return REGISTRY[teamId]?.[locale];
}
