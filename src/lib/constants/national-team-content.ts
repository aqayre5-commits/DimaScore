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

  // 2 — France (Les Bleus)
  2: {
    en: {
      about:
        'France — Les Bleus — is the national team governed by the FFF and competing in UEFA. Two-time world champions and runners-up at the 2022 World Cup.',
      honours: [
        { competition: 'World Cup', detail: 'Winners — 1998, 2018' },
        { competition: 'European Championship', detail: 'Winners — 1984, 2000' },
        { competition: 'UEFA Nations League', detail: 'Winners — 2021' },
      ],
    },
    fr: {
      about:
        'La France — les Bleus — est l’équipe nationale gérée par la FFF et évoluant au sein de l’UEFA. Double championne du monde et finaliste de la Coupe du Monde 2022.',
      honours: [
        { competition: 'Coupe du Monde', detail: 'Vainqueur — 1998, 2018' },
        { competition: 'Championnat d’Europe', detail: 'Vainqueur — 1984, 2000' },
        { competition: 'Ligue des Nations', detail: 'Vainqueur — 2021' },
      ],
    },
    ar: {
      about:
        'فرنسا — الديوك — هي المنتخب الوطني الذي يشرف عليه الاتحاد الفرنسي وينافس ضمن اليويفا. بطلة العالم مرتين ووصيفة نهائي كأس العالم 2022.',
      honours: [
        { competition: 'كأس العالم', detail: 'البطل — 1998، 2018' },
        { competition: 'بطولة أوروبا', detail: 'البطل — 1984، 2000' },
        { competition: 'دوري الأمم الأوروبية', detail: 'البطل — 2021' },
      ],
    },
  },

  // 9 — Spain (La Roja)
  9: {
    en: {
      about:
        'Spain — La Roja — is the national team governed by the RFEF and competing in UEFA. World champions in 2010 and a record four-time European champion.',
      honours: [
        { competition: 'World Cup', detail: 'Winners — 2010' },
        { competition: 'European Championship', detail: 'Winners — 1964, 2008, 2012, 2024' },
        { competition: 'UEFA Nations League', detail: 'Winners — 2023' },
      ],
    },
    fr: {
      about:
        'L’Espagne — la Roja — est l’équipe nationale gérée par la RFEF et évoluant au sein de l’UEFA. Championne du monde en 2010 et recordwoman des titres européens.',
      honours: [
        { competition: 'Coupe du Monde', detail: 'Vainqueur — 2010' },
        { competition: 'Championnat d’Europe', detail: 'Vainqueur — 1964, 2008, 2012, 2024' },
        { competition: 'Ligue des Nations', detail: 'Vainqueur — 2023' },
      ],
    },
    ar: {
      about:
        'إسبانيا — لا روخا — هي المنتخب الوطني الذي يشرف عليه الاتحاد الإسباني وينافس ضمن اليويفا. بطلة العالم 2010 وصاحبة الرقم القياسي في ألقاب أوروبا.',
      honours: [
        { competition: 'كأس العالم', detail: 'البطل — 2010' },
        { competition: 'بطولة أوروبا', detail: 'البطل — 1964، 2008، 2012، 2024' },
        { competition: 'دوري الأمم الأوروبية', detail: 'البطل — 2023' },
      ],
    },
  },

  // 10 — England (Three Lions)
  10: {
    en: {
      about:
        'England — the Three Lions — is the national team governed by The FA and competing in UEFA. 1966 World Cup winners and runners-up at Euro 2020 and Euro 2024.',
      honours: [
        { competition: 'World Cup', detail: 'Winners — 1966' },
        { competition: 'European Championship', detail: 'Runners-up — 2020, 2024' },
      ],
    },
    fr: {
      about:
        'L’Angleterre — les Three Lions — est l’équipe nationale gérée par la FA et évoluant au sein de l’UEFA. Championne du monde 1966 et finaliste de l’Euro 2020 et de l’Euro 2024.',
      honours: [
        { competition: 'Coupe du Monde', detail: 'Vainqueur — 1966' },
        { competition: 'Championnat d’Europe', detail: 'Finaliste — 2020, 2024' },
      ],
    },
    ar: {
      about:
        'إنجلترا — الأسود الثلاثة — هي المنتخب الوطني الذي يشرف عليه الاتحاد الإنجليزي وينافس ضمن اليويفا. بطلة العالم 1966 ووصيفة بطولتي أوروبا 2020 و2024.',
      honours: [
        { competition: 'كأس العالم', detail: 'البطل — 1966' },
        { competition: 'بطولة أوروبا', detail: 'الوصيف — 2020، 2024' },
      ],
    },
  },

  // 6 — Brazil (Seleção)
  6: {
    en: {
      about:
        'Brazil — the Seleção — is the national team governed by the CBF and competing in CONMEBOL. Record five-time world champions and the only nation to appear at every World Cup.',
      honours: [
        { competition: 'World Cup', detail: 'Winners (record 5) — 1958, 1962, 1970, 1994, 2002' },
        { competition: 'Copa América', detail: 'Winners — 9 titles' },
      ],
    },
    fr: {
      about:
        'Le Brésil — la Seleção — est l’équipe nationale gérée par la CBF et évoluant au sein de la CONMEBOL. Recordwoman avec cinq titres mondiaux et seule nation présente à toutes les Coupes du Monde.',
      honours: [
        {
          competition: 'Coupe du Monde',
          detail: 'Vainqueur (record 5) — 1958, 1962, 1970, 1994, 2002',
        },
        { competition: 'Copa América', detail: 'Vainqueur — 9 titres' },
      ],
    },
    ar: {
      about:
        'البرازيل — السيليساو — هي المنتخب الوطني الذي يشرف عليه الاتحاد البرازيلي وينافس ضمن كونميبول. صاحبة الرقم القياسي بخمسة ألقاب عالمية والمنتخب الوحيد الذي شارك في كل نسخ كأس العالم.',
      honours: [
        { competition: 'كأس العالم', detail: 'البطل (رقم قياسي 5) — 1958، 1962، 1970، 1994، 2002' },
        { competition: 'كوبا أمريكا', detail: 'البطل — 9 ألقاب' },
      ],
    },
  },

  // 26 — Argentina (Albiceleste)
  26: {
    en: {
      about:
        'Argentina — the Albiceleste — is the national team governed by the AFA and competing in CONMEBOL. Three-time world champions and the reigning World Cup winners (2022).',
      honours: [
        { competition: 'World Cup', detail: 'Winners — 1978, 1986, 2022' },
        { competition: 'Copa América', detail: 'Winners — 16 titles (record)' },
        { competition: 'Finalissima', detail: 'Winners — 2022' },
      ],
    },
    fr: {
      about:
        'L’Argentine — l’Albiceleste — est l’équipe nationale gérée par l’AFA et évoluant au sein de la CONMEBOL. Triple championne du monde et tenante du titre mondial (2022).',
      honours: [
        { competition: 'Coupe du Monde', detail: 'Vainqueur — 1978, 1986, 2022' },
        { competition: 'Copa América', detail: 'Vainqueur — 16 titres (record)' },
        { competition: 'Finalissima', detail: 'Vainqueur — 2022' },
      ],
    },
    ar: {
      about:
        'الأرجنتين — ألبيسيليستي — هي المنتخب الوطني الذي يشرف عليه الاتحاد الأرجنتيني وينافس ضمن كونميبول. بطلة العالم ثلاث مرات وحاملة لقب كأس العالم 2022.',
      honours: [
        { competition: 'كأس العالم', detail: 'البطل — 1978، 1986، 2022' },
        { competition: 'كوبا أمريكا', detail: 'البطل — 16 لقباً (رقم قياسي)' },
        { competition: 'فيناليسيما', detail: 'البطل — 2022' },
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
