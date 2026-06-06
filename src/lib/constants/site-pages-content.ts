/**
 * Starter copy for the static footer pages (legal, privacy, about, contact, faq).
 *
 * Intentionally concise — these are launch placeholders to be refined editorially.
 * Items marked [TODO] need real legal/identity details before launch. Keep the prose
 * here (not in the i18n message bundles) so it stays co-located and easy to revise.
 */
import type { Locale } from '@/lib/i18n/config';

/** Swap this for the real address once it exists. */
export const CONTACT_EMAIL = 'contact@dimascore.com';

export interface PageSection {
  heading: string;
  body: string[];
}

export interface StaticPageContent {
  title: string;
  description: string;
  sections: PageSection[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface FaqPageContent {
  title: string;
  description: string;
  items: FaqItem[];
}

export interface SitePagesContent {
  legal: StaticPageContent;
  privacy: StaticPageContent;
  about: StaticPageContent;
  contact: StaticPageContent;
  faq: FaqPageContent;
}

export const SITE_PAGES_CONTENT: Record<Locale, SitePagesContent> = {
  en: {
    about: {
      title: 'About DimaScore',
      description:
        'DimaScore is a Morocco-focused football data and media platform — Botola Pro, the Atlas Lions, World Cup 2026, AFCON, WAFCON and more.',
      sections: [
        {
          heading: 'Our mission',
          body: [
            'DimaScore brings Moroccan and international football together in one fast, reliable place: live scores, fixtures, standings, squads and editorial coverage — in Arabic, French and English.',
            "We focus on the competitions Moroccan fans care about most, from the Botola Pro to the Atlas Lions' road through World Cup 2026.",
          ],
        },
        {
          heading: 'What we cover',
          body: [
            'Live scores and match details across domestic and international competitions.',
            'Team and player pages, standings, top scorers and tournament squads.',
            "Editorial predictions and analysis — presented as DimaScore's own view, never as betting odds.",
          ],
        },
        {
          heading: 'Our data',
          body: [
            'Match, team and player data is aggregated from official and licensed providers and refreshed continuously. Coverage depth varies by competition.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy policy',
      description:
        'How DimaScore collects, uses and protects your personal data, in line with Law 09-08.',
      sections: [
        {
          heading: 'Overview',
          body: [
            'This policy explains what data DimaScore collects and how we use it. We comply with Moroccan Law 09-08 on the protection of individuals with regard to the processing of personal data.',
          ],
        },
        {
          heading: 'Data we collect',
          body: [
            'We keep data collection to a minimum and do not require an account to use the site.',
            'Anonymous, aggregated analytics (pages viewed, approximate region, device type) help us understand and improve usage.',
            'Strictly necessary cookies keep the site working; non-essential cookies are only set with your consent.',
          ],
        },
        {
          heading: 'How we use it',
          body: [
            'To operate and improve the site, measure audience and keep the service secure. We do not sell your personal data.',
          ],
        },
        {
          heading: 'Your rights',
          body: [
            `Under Law 09-08 you may request access to, correction of, or deletion of your personal data. Email us at ${CONTACT_EMAIL}.`,
            '[TODO: data controller identity and CNDP declaration reference.]',
          ],
        },
      ],
    },
    legal: {
      title: 'Legal notice',
      description: 'Publisher, hosting and intellectual-property information for DimaScore.',
      sections: [
        {
          heading: 'Publisher',
          body: [
            '[TODO: legal entity / publisher name, address and registration details.]',
            `Contact: ${CONTACT_EMAIL}`,
          ],
        },
        {
          heading: 'Hosting',
          body: ['This site is hosted by Vercel Inc. [TODO: confirm host name and address.]'],
        },
        {
          heading: 'Intellectual property',
          body: [
            'The DimaScore name, design and editorial content are protected. Football data, names and logos remain the property of their respective owners.',
            'Reproduction without prior authorisation is prohibited.',
          ],
        },
        {
          heading: 'Responsibility',
          body: [
            'DimaScore does not provide betting or odds services. Predictions are editorial opinion only.',
          ],
        },
      ],
    },
    contact: {
      title: 'Contact',
      description: 'Get in touch with the DimaScore team.',
      sections: [
        {
          heading: 'Email us',
          body: [
            'For questions, corrections or partnership enquiries, email us using the address below. We aim to reply within a few business days.',
          ],
        },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      description: 'Common questions about DimaScore — coverage, data, languages and more.',
      items: [
        {
          q: 'Is DimaScore free to use?',
          a: 'Yes. DimaScore is free to browse — no account is required.',
        },
        {
          q: 'Does DimaScore show betting odds?',
          a: 'No. We never display odds. Any predictions are editorial opinion, in line with Law 09-08 and our brand standards.',
        },
        {
          q: 'Which competitions do you cover?',
          a: 'Moroccan football (Botola Pro and cups), the Atlas Lions, World Cup 2026, AFCON, WAFCON and a growing set of international competitions.',
        },
        {
          q: 'How often is live data updated?',
          a: 'Live scores and match details refresh continuously during matches. Standings and statistics update shortly after each round.',
        },
        {
          q: 'Which languages are available?',
          a: 'DimaScore is available in Arabic, French and English. Use the language switcher in the header to change.',
        },
      ],
    },
  },

  fr: {
    about: {
      title: 'À propos de DimaScore',
      description:
        'DimaScore est une plateforme de données et de médias dédiée au football marocain — Botola Pro, Lions de l’Atlas, Coupe du Monde 2026, CAN, CAN féminine et plus encore.',
      sections: [
        {
          heading: 'Notre mission',
          body: [
            'DimaScore réunit le football marocain et international en un seul endroit rapide et fiable : scores en direct, calendriers, classements, effectifs et contenus éditoriaux — en arabe, français et anglais.',
            'Nous nous concentrons sur les compétitions qui comptent le plus pour les supporters marocains, de la Botola Pro au parcours des Lions de l’Atlas vers la Coupe du Monde 2026.',
          ],
        },
        {
          heading: 'Ce que nous couvrons',
          body: [
            'Scores en direct et détails des matchs des compétitions nationales et internationales.',
            'Pages des équipes et des joueurs, classements, meilleurs buteurs et effectifs des tournois.',
            'Pronostics et analyses éditoriaux — présentés comme l’avis de DimaScore, jamais comme des cotes de paris.',
          ],
        },
        {
          heading: 'Nos données',
          body: [
            'Les données des matchs, des équipes et des joueurs proviennent de fournisseurs officiels et sous licence, et sont actualisées en continu. La profondeur de la couverture varie selon la compétition.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité',
      description:
        'Comment DimaScore collecte, utilise et protège vos données personnelles, conformément à la loi 09-08.',
      sections: [
        {
          heading: 'Aperçu',
          body: [
            'Cette politique explique quelles données DimaScore collecte et comment nous les utilisons. Nous respectons la loi marocaine 09-08 relative à la protection des personnes à l’égard du traitement des données à caractère personnel.',
          ],
        },
        {
          heading: 'Données collectées',
          body: [
            'Nous réduisons la collecte au minimum et aucun compte n’est requis pour utiliser le site.',
            'Des statistiques anonymes et agrégées (pages vues, région approximative, type d’appareil) nous aident à comprendre et à améliorer l’usage.',
            'Les cookies strictement nécessaires assurent le fonctionnement du site ; les cookies non essentiels ne sont déposés qu’avec votre consentement.',
          ],
        },
        {
          heading: 'Utilisation',
          body: [
            'Pour exploiter et améliorer le site, mesurer l’audience et sécuriser le service. Nous ne vendons pas vos données personnelles.',
          ],
        },
        {
          heading: 'Vos droits',
          body: [
            `Conformément à la loi 09-08, vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles. Écrivez-nous à ${CONTACT_EMAIL}.`,
            '[TODO : identité du responsable de traitement et référence de la déclaration CNDP.]',
          ],
        },
      ],
    },
    legal: {
      title: 'Mentions légales',
      description:
        'Informations sur l’éditeur, l’hébergement et la propriété intellectuelle de DimaScore.',
      sections: [
        {
          heading: 'Éditeur',
          body: [
            '[TODO : raison sociale / nom de l’éditeur, adresse et informations d’immatriculation.]',
            `Contact : ${CONTACT_EMAIL}`,
          ],
        },
        {
          heading: 'Hébergement',
          body: [
            'Ce site est hébergé par Vercel Inc. [TODO : confirmer le nom et l’adresse de l’hébergeur.]',
          ],
        },
        {
          heading: 'Propriété intellectuelle',
          body: [
            'Le nom DimaScore, le design et les contenus éditoriaux sont protégés. Les données, noms et logos du football restent la propriété de leurs détenteurs respectifs.',
            'Toute reproduction sans autorisation préalable est interdite.',
          ],
        },
        {
          heading: 'Responsabilité',
          body: [
            'DimaScore ne propose aucun service de paris ou de cotes. Les pronostics relèvent d’une opinion éditoriale uniquement.',
          ],
        },
      ],
    },
    contact: {
      title: 'Contact',
      description: 'Contactez l’équipe de DimaScore.',
      sections: [
        {
          heading: 'Écrivez-nous',
          body: [
            'Pour toute question, correction ou demande de partenariat, écrivez-nous à l’adresse ci-dessous. Nous nous efforçons de répondre sous quelques jours ouvrés.',
          ],
        },
      ],
    },
    faq: {
      title: 'Foire aux questions',
      description:
        'Questions fréquentes sur DimaScore — couverture, données, langues et plus encore.',
      items: [
        {
          q: 'DimaScore est-il gratuit ?',
          a: 'Oui. La consultation de DimaScore est gratuite — aucun compte n’est nécessaire.',
        },
        {
          q: 'DimaScore affiche-t-il des cotes de paris ?',
          a: 'Non. Nous n’affichons jamais de cotes. Les pronostics relèvent d’une opinion éditoriale, conformément à la loi 09-08 et à nos standards de marque.',
        },
        {
          q: 'Quelles compétitions couvrez-vous ?',
          a: 'Le football marocain (Botola Pro et coupes), les Lions de l’Atlas, la Coupe du Monde 2026, la CAN, la CAN féminine et un ensemble croissant de compétitions internationales.',
        },
        {
          q: 'À quelle fréquence les données en direct sont-elles mises à jour ?',
          a: 'Les scores et détails des matchs sont actualisés en continu pendant les rencontres. Les classements et statistiques sont mis à jour peu après chaque journée.',
        },
        {
          q: 'Quelles langues sont disponibles ?',
          a: 'DimaScore est disponible en arabe, français et anglais. Utilisez le sélecteur de langue dans l’en-tête pour changer.',
        },
      ],
    },
  },

  ar: {
    about: {
      title: 'عن ديماسكور',
      description:
        'ديماسكور منصّة بيانات وإعلام كروية تركّز على المغرب — البطولة الاحترافية، أسود الأطلس، كأس العالم 2026، كأس أمم إفريقيا وكأس أمم إفريقيا للسيدات وغيرها.',
      sections: [
        {
          heading: 'مهمّتنا',
          body: [
            'يجمع ديماسكور الكرة المغربية والعالمية في مكان واحد سريع وموثوق: نتائج مباشرة، ومواعيد المباريات، والترتيب، والتشكيلات، والمحتوى التحريري — بالعربية والفرنسية والإنجليزية.',
            'نركّز على المنافسات الأقرب إلى الجمهور المغربي، من البطولة الاحترافية إلى مشوار أسود الأطلس نحو كأس العالم 2026.',
          ],
        },
        {
          heading: 'ما الذي نغطّيه',
          body: [
            'النتائج المباشرة وتفاصيل المباريات في المنافسات المحلية والدولية.',
            'صفحات الفرق واللاعبين، والترتيب، والهدّافين، وتشكيلات البطولات.',
            'التوقّعات والتحليلات التحريرية — تُقدَّم بوصفها رأي ديماسكور، وليست أبدًا حصصًا للرهان.',
          ],
        },
        {
          heading: 'بياناتنا',
          body: [
            'تُجمع بيانات المباريات والفرق واللاعبين من مزوّدين رسميين ومرخَّصين وتُحدَّث باستمرار. ويختلف عمق التغطية حسب المنافسة.',
          ],
        },
      ],
    },
    privacy: {
      title: 'سياسة الخصوصية',
      description:
        'كيف يجمع ديماسكور بياناتك الشخصية ويستخدمها ويحميها، بما يتوافق مع القانون 09-08.',
      sections: [
        {
          heading: 'لمحة عامة',
          body: [
            'توضّح هذه السياسة البيانات التي يجمعها ديماسكور وكيفية استخدامها. نلتزم بالقانون المغربي 09-08 المتعلّق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي.',
          ],
        },
        {
          heading: 'البيانات التي نجمعها',
          body: [
            'نُبقي جمع البيانات في حدّه الأدنى ولا نشترط إنشاء حساب لاستخدام الموقع.',
            'إحصاءات مجهولة ومجمَّعة (الصفحات المُشاهَدة، المنطقة التقريبية، نوع الجهاز) تساعدنا على فهم الاستخدام وتحسينه.',
            'ملفّات تعريف الارتباط الضرورية تُبقي الموقع يعمل؛ أمّا غير الضرورية فلا تُفعَّل إلّا بموافقتك.',
          ],
        },
        {
          heading: 'كيف نستخدمها',
          body: [
            'لتشغيل الموقع وتحسينه، وقياس الجمهور، والحفاظ على أمن الخدمة. لا نبيع بياناتك الشخصية.',
          ],
        },
        {
          heading: 'حقوقك',
          body: [
            `وفقًا للقانون 09-08، يمكنك طلب الاطّلاع على بياناتك الشخصية أو تصحيحها أو حذفها. راسلنا على ${CONTACT_EMAIL}.`,
            '[TODO: هوية المسؤول عن المعالجة ومرجع التصريح لدى اللجنة الوطنية (CNDP).]',
          ],
        },
      ],
    },
    legal: {
      title: 'إشعار قانوني',
      description: 'معلومات النشر والاستضافة والملكية الفكرية الخاصة بديماسكور.',
      sections: [
        {
          heading: 'الناشر',
          body: [
            '[TODO: الكيان القانوني / اسم الناشر والعنوان وبيانات التسجيل.]',
            `للتواصل: ${CONTACT_EMAIL}`,
          ],
        },
        {
          heading: 'الاستضافة',
          body: ['يُستضاف هذا الموقع لدى Vercel Inc. [TODO: تأكيد اسم المستضيف وعنوانه.]'],
        },
        {
          heading: 'الملكية الفكرية',
          body: [
            'اسم ديماسكور وتصميمه ومحتواه التحريري محميّة. وتبقى بيانات الكرة وأسماؤها وشعاراتها ملكًا لأصحابها.',
            'يُمنع أيّ استنساخ دون إذن مسبق.',
          ],
        },
        {
          heading: 'المسؤولية',
          body: ['لا يقدّم ديماسكور أيّ خدمات للرهان أو الحصص. التوقّعات رأي تحريري فقط.'],
        },
      ],
    },
    contact: {
      title: 'اتصل بنا',
      description: 'تواصل مع فريق ديماسكور.',
      sections: [
        {
          heading: 'راسلنا',
          body: [
            'لأيّ سؤال أو تصحيح أو طلب شراكة، راسلنا على العنوان أدناه. نسعى للردّ خلال أيّام عمل قليلة.',
          ],
        },
      ],
    },
    faq: {
      title: 'الأسئلة الشائعة',
      description: 'أسئلة شائعة حول ديماسكور — التغطية والبيانات واللغات وغيرها.',
      items: [
        {
          q: 'هل استخدام ديماسكور مجاني؟',
          a: 'نعم. تصفّح ديماسكور مجاني — ولا يلزم إنشاء حساب.',
        },
        {
          q: 'هل يعرض ديماسكور حصص الرهان؟',
          a: 'لا. لا نعرض الحصص إطلاقًا. أيّ توقّعات هي رأي تحريري، بما يتوافق مع القانون 09-08 ومعايير علامتنا.',
        },
        {
          q: 'ما المنافسات التي تغطّونها؟',
          a: 'الكرة المغربية (البطولة الاحترافية والكؤوس)، وأسود الأطلس، وكأس العالم 2026، وكأس أمم إفريقيا، وكأس أمم إفريقيا للسيدات، ومجموعة متنامية من المنافسات الدولية.',
        },
        {
          q: 'كم مرّة تُحدَّث البيانات المباشرة؟',
          a: 'تُحدَّث النتائج وتفاصيل المباريات باستمرار أثناء اللقاءات. ويُحدَّث الترتيب والإحصاءات بُعيد كلّ جولة.',
        },
        {
          q: 'ما اللغات المتاحة؟',
          a: 'يتوفّر ديماسكور بالعربية والفرنسية والإنجليزية. استخدم مبدّل اللغة في الأعلى للتغيير.',
        },
      ],
    },
  },
};
