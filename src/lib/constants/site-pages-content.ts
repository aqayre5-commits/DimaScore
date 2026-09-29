/**
 * Copy for the static footer pages (legal, privacy, terms, cookiePolicy, about, contact, faq).
 *
 * Intentionally concise — starter copy to be refined editorially. Legal identity: publisher /
 * data controller is REN Technology Limited (England & Wales, company no. 13694812); framework is
 * GDPR. Keep the prose here (not in the i18n message bundles) so it stays co-located and easy to
 * revise. Legal wording is starter text, not legal advice — have it reviewed before relying on it.
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
  terms: StaticPageContent;
  cookiePolicy: StaticPageContent;
  about: StaticPageContent;
  contact: StaticPageContent;
  faq: FaqPageContent;
}

export const SITE_PAGES_CONTENT: Record<Locale, SitePagesContent> = {
  en: {
    terms: {
      title: 'Terms of Use',
      description: 'The terms governing your use of DimaScore.',
      sections: [
        {
          heading: 'Acceptance',
          body: [
            'By accessing DimaScore you agree to these terms. If you do not agree, please do not use the site.',
          ],
        },
        {
          heading: 'The service',
          body: [
            'DimaScore provides football scores, fixtures, standings and statistics for information purposes only.',
          ],
        },
        {
          heading: 'Data accuracy',
          body: [
            'Data is supplied by third-party providers and offered "as is". Scores and times may be delayed or contain errors. DimaScore is not liable for decisions made in reliance on it.',
          ],
        },
        {
          heading: 'No betting',
          body: ['DimaScore does not offer betting or odds and is not a gambling service.'],
        },
        {
          heading: 'Intellectual property',
          body: [
            'The site, its design and original content are protected. Club and competition names and logos belong to their respective owners.',
          ],
        },
        {
          heading: 'Acceptable use',
          body: ['You may not scrape, disrupt, or attempt to compromise the service.'],
        },
        {
          heading: 'Liability',
          body: [
            'The service is provided without warranty of availability or accuracy, to the extent permitted by law.',
          ],
        },
        {
          heading: 'Changes',
          body: [
            'These terms may be updated. Continued use of the site constitutes acceptance of the current version.',
          ],
        },
        {
          heading: 'Governing law',
          body: ['These terms are governed by the laws of England and Wales.'],
        },
        { heading: 'Contact', body: ['Questions about these terms: contact@dimascore.com'] },
      ],
    },
    cookiePolicy: {
      title: 'Cookie Policy',
      description: 'How DimaScore uses cookies and similar technologies.',
      sections: [
        {
          heading: 'What cookies are',
          body: [
            'Cookies are small files stored on your device that help the site work and let us measure how it is used.',
          ],
        },
        {
          heading: 'Strictly necessary',
          body: [
            'These remember your language and theme preference and your cookie-notice choice. They are always active.',
          ],
        },
        {
          heading: 'Analytics',
          body: [
            'Google Analytics 4, loaded through Google Tag Manager, helps us understand aggregate traffic.',
          ],
        },
        {
          heading: 'Marketing',
          body: ['The Meta Pixel helps us measure the reach of DimaScore content.'],
        },
        {
          heading: 'Managing cookies',
          body: [
            'You can block or delete cookies in your browser settings. Some features may then not work as intended.',
          ],
        },
        {
          heading: 'Changes',
          body: ['This policy may be updated. The most recent version always applies.'],
        },
        { heading: 'Contact', body: ['Questions about cookies: contact@dimascore.com'] },
      ],
    },
    about: {
      title: 'About DimaScore',
      description:
        'Live football scores, fixtures, and stats across the major competitions — with deep coverage of Moroccan football.',
      sections: [
        {
          heading: 'DimaScore — live football, with Morocco at the heart of it',
          body: [
            "DimaScore covers the world of football: live scores and fixtures across the major competitions — the World Cup, AFCON, WAFCON, the Champions League, and Europe's top leagues — refreshed in seconds, every match.",
            'Built in Morocco, DimaScore goes deeper than anyone on Moroccan football. Full Botola Pro and Coupe du Trône coverage, the Atlas Lions across AFCON and World Cup cycles, and a dedicated rail tracking Moroccan players abroad.',
            'No betting. No ads. Multilingual: French, English, Arabic.',
          ],
        },
        {
          heading: 'What you get',
          body: [
            'Live scores and match details — refreshed every 15 seconds when a match is in progress.',
            'Team and player pages, standings, top scorers, tournament squads, and knockout brackets.',
            "Editorial predictions and analysis — DimaScore's own view, never betting odds.",
          ],
        },
        {
          heading: 'Our data',
          body: [
            'Match, team and player data is aggregated from licensed providers and refreshed continuously. Coverage depth varies by competition.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy policy',
      description:
        'How DimaScore collects, uses and protects your personal data, in line with the GDPR.',
      sections: [
        {
          heading: 'Overview',
          body: [
            'This policy explains what data DimaScore collects and how we use it. We process personal data in accordance with the EU General Data Protection Regulation (GDPR).',
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
            `Under the GDPR you may request access to, correction or erasure of your personal data, and object to or restrict its processing. Email us at ${CONTACT_EMAIL}.`,
            'The data controller is REN Technology Limited, a company registered in England and Wales (company number 13694812).',
          ],
        },
      ],
    },
    legal: {
      title: 'Legal notice',
      description: 'Publisher and intellectual-property information for DimaScore.',
      sections: [
        {
          heading: 'Publisher',
          body: [
            'DimaScore is published by REN Technology Limited, a company registered in England and Wales under company number 13694812.',
            `Contact: ${CONTACT_EMAIL}`,
          ],
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
          a: "No. We never display odds. Any predictions are editorial opinion — DimaScore's view of the match, never a wager.",
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
    terms: {
      title: "Conditions d'utilisation",
      description: 'Les conditions régissant votre utilisation de DimaScore.',
      sections: [
        {
          heading: 'Acceptation',
          body: [
            "En accédant à DimaScore, vous acceptez ces conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser le site.",
          ],
        },
        {
          heading: 'Le service',
          body: [
            'DimaScore fournit des scores, calendriers, classements et statistiques de football à titre informatif uniquement.',
          ],
        },
        {
          heading: 'Exactitude des données',
          body: [
            "Les données proviennent de fournisseurs tiers et sont fournies « en l'état ». Les scores et horaires peuvent être retardés ou comporter des erreurs. DimaScore décline toute responsabilité quant aux décisions prises sur cette base.",
          ],
        },
        {
          heading: 'Pas de paris',
          body: [
            "DimaScore ne propose ni paris ni cotes et n'est pas un service de jeux d'argent.",
          ],
        },
        {
          heading: 'Propriété intellectuelle',
          body: [
            'Le site, son design et son contenu original sont protégés. Les noms et logos des clubs et compétitions appartiennent à leurs propriétaires respectifs.',
          ],
        },
        {
          heading: 'Utilisation acceptable',
          body: [
            "Il est interdit d'extraire des données, de perturber ou de tenter de compromettre le service.",
          ],
        },
        {
          heading: 'Responsabilité',
          body: [
            "Le service est fourni sans garantie de disponibilité ni d'exactitude, dans les limites autorisées par la loi.",
          ],
        },
        {
          heading: 'Modifications',
          body: [
            "Ces conditions peuvent être mises à jour. La poursuite de l'utilisation vaut acceptation de la version en vigueur.",
          ],
        },
        {
          heading: 'Droit applicable',
          body: ["Ces conditions sont régies par le droit de l'Angleterre et du Pays de Galles."],
        },
        { heading: 'Contact', body: ['Questions sur ces conditions : contact@dimascore.com'] },
      ],
    },
    cookiePolicy: {
      title: 'Politique relative aux cookies',
      description: 'Comment DimaScore utilise les cookies et technologies similaires.',
      sections: [
        {
          heading: 'Que sont les cookies',
          body: [
            "Les cookies sont de petits fichiers stockés sur votre appareil qui font fonctionner le site et nous permettent d'en mesurer l'utilisation.",
          ],
        },
        {
          heading: 'Strictement nécessaires',
          body: [
            "Ils mémorisent votre langue, votre thème et votre choix concernant l'avis sur les cookies. Toujours actifs.",
          ],
        },
        {
          heading: "Mesure d'audience",
          body: [
            'Google Analytics 4, chargé via Google Tag Manager, nous aide à comprendre le trafic global.',
          ],
        },
        {
          heading: 'Marketing',
          body: ['Le pixel Meta nous aide à mesurer la portée des contenus DimaScore.'],
        },
        {
          heading: 'Gérer les cookies',
          body: [
            'Vous pouvez bloquer ou supprimer les cookies dans les paramètres de votre navigateur. Certaines fonctionnalités pourraient alors ne plus fonctionner.',
          ],
        },
        {
          heading: 'Modifications',
          body: [
            "Cette politique peut être mise à jour. La version la plus récente s'applique toujours.",
          ],
        },
        { heading: 'Contact', body: ['Questions sur les cookies : contact@dimascore.com'] },
      ],
    },
    about: {
      title: 'À propos de DimaScore',
      description:
        'Scores, calendriers et statistiques de football en direct sur les grandes compétitions — avec une couverture approfondie du football marocain.',
      sections: [
        {
          heading: 'DimaScore — le football en direct, avec le Maroc au cœur',
          body: [
            'DimaScore couvre tout le football : scores et calendriers en direct sur les grandes compétitions — Coupe du Monde, CAN, CAN féminine, Ligue des Champions, et les grands championnats européens — actualisés en quelques secondes, chaque match.',
            'Construit au Maroc, DimaScore va plus loin que personne sur le football marocain. Couverture complète de la Botola Pro et de la Coupe du Trône, suivi des Lions de l’Atlas sur la CAN et la Coupe du Monde, et un fil dédié aux joueurs marocains à l’étranger.',
            'Sans paris, sans publicité. Multilingue : français, anglais, arabe.',
          ],
        },
        {
          heading: 'Ce que vous obtenez',
          body: [
            'Scores en direct et détails des matchs — actualisés toutes les 15 secondes pendant qu’un match est en cours.',
            'Pages d’équipes et de joueurs, classements, meilleurs buteurs, effectifs et tableaux à élimination directe.',
            'Pronostics et analyses éditoriaux — l’avis de DimaScore, jamais des cotes de paris.',
          ],
        },
        {
          heading: 'Nos données',
          body: [
            'Les données des matchs, équipes et joueurs proviennent de fournisseurs sous licence et sont actualisées en continu. La profondeur de la couverture varie selon la compétition.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité',
      description:
        'Comment DimaScore collecte, utilise et protège vos données personnelles, conformément au RGPD.',
      sections: [
        {
          heading: 'Aperçu',
          body: [
            'Cette politique explique quelles données DimaScore collecte et comment nous les utilisons. Nous traitons les données personnelles conformément au Règlement général sur la protection des données (RGPD).',
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
            `Conformément au RGPD, vous pouvez demander l’accès, la rectification ou la suppression de vos données personnelles, et vous opposer à leur traitement ou en demander la limitation. Écrivez-nous à ${CONTACT_EMAIL}.`,
            'Le responsable du traitement est REN Technology Limited, société immatriculée en Angleterre et au Pays de Galles (numéro de société 13694812).',
          ],
        },
      ],
    },
    legal: {
      title: 'Mentions légales',
      description: 'Informations sur l’éditeur et la propriété intellectuelle de DimaScore.',
      sections: [
        {
          heading: 'Éditeur',
          body: [
            'DimaScore est édité par REN Technology Limited, société immatriculée en Angleterre et au Pays de Galles sous le numéro 13694812.',
            `Contact : ${CONTACT_EMAIL}`,
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
          a: 'Non. Nous n’affichons jamais de cotes. Les pronostics sont une opinion éditoriale — l’avis de DimaScore sur le match, jamais un pari.',
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
    terms: {
      title: 'شروط الاستخدام',
      description: 'الشروط التي تحكم استخدامك لديماسكور.',
      sections: [
        {
          heading: 'القبول',
          body: [
            'بدخولك إلى ديماسكور فإنك توافق على هذه الشروط. إذا لم توافق، يُرجى عدم استخدام الموقع.',
          ],
        },
        {
          heading: 'الخدمة',
          body: [
            'يقدّم ديماسكور نتائج كرة القدم والمباريات والترتيب والإحصاءات لأغراض إعلامية فقط.',
          ],
        },
        {
          heading: 'دقة البيانات',
          body: [
            'تُقدَّم البيانات من مزوّدين خارجيين «كما هي». قد تتأخر النتائج والأوقات أو تحتوي على أخطاء. لا يتحمّل ديماسكور مسؤولية القرارات المتخذة بناءً عليها.',
          ],
        },
        {
          heading: 'لا مراهنات',
          body: ['لا يقدّم ديماسكور مراهنات أو احتمالات، وليس خدمة قمار.'],
        },
        {
          heading: 'الملكية الفكرية',
          body: [
            'الموقع وتصميمه ومحتواه الأصلي محمية. أسماء وشعارات الأندية والبطولات ملك لأصحابها.',
          ],
        },
        {
          heading: 'الاستخدام المقبول',
          body: ['يُمنع استخراج البيانات أو تعطيل الخدمة أو محاولة اختراقها.'],
        },
        {
          heading: 'المسؤولية',
          body: ['تُقدَّم الخدمة دون ضمان للتوفّر أو الدقة، في الحدود التي يسمح بها القانون.'],
        },
        {
          heading: 'التغييرات',
          body: ['قد تُحدَّث هذه الشروط. استمرارك في الاستخدام يعني قبول النسخة السارية.'],
        },
        {
          heading: 'القانون المطبّق',
          body: ['تخضع هذه الشروط لقوانين إنجلترا وويلز.'],
        },
        { heading: 'اتصل بنا', body: ['أسئلة حول هذه الشروط: contact@dimascore.com'] },
      ],
    },
    cookiePolicy: {
      title: 'سياسة ملفات تعريف الارتباط',
      description: 'كيف يستخدم ديماسكور ملفات تعريف الارتباط والتقنيات المشابهة.',
      sections: [
        {
          heading: 'ما هي ملفات تعريف الارتباط',
          body: [
            'هي ملفات صغيرة تُخزَّن على جهازك تساعد الموقع على العمل وتتيح لنا قياس استخدامه.',
          ],
        },
        {
          heading: 'ضرورية تمامًا',
          body: ['تتذكّر لغتك وسمتك واختيارك بشأن إشعار ملفات تعريف الارتباط. تعمل دائمًا.'],
        },
        {
          heading: 'قياس الأداء',
          body: [
            'يساعدنا Google Analytics 4، المُحمّل عبر Google Tag Manager، على فهم إجمالي الزيارات.',
          ],
        },
        {
          heading: 'التسويق',
          body: ['يساعدنا Meta Pixel على قياس مدى وصول محتوى ديماسكور.'],
        },
        {
          heading: 'إدارة ملفات تعريف الارتباط',
          body: [
            'يمكنك حظر أو حذف ملفات تعريف الارتباط من إعدادات متصفحك. قد لا تعمل بعض الميزات حينها.',
          ],
        },
        {
          heading: 'التغييرات',
          body: ['قد تُحدَّث هذه السياسة. تسري دائمًا النسخة الأحدث.'],
        },
        { heading: 'اتصل بنا', body: ['أسئلة حول ملفات تعريف الارتباط: contact@dimascore.com'] },
      ],
    },
    about: {
      title: 'عن ديماسكور',
      description:
        'نتائج وجداول وإحصاءات كروية مباشرة على أبرز المنافسات — مع تغطية معمّقة للكرة المغربية.',
      sections: [
        {
          heading: 'ديماسكور — كرة القدم مباشرة، والمغرب في صميمها',
          body: [
            'يغطي ديماسكور كرة القدم في العالم: نتائج وجداول مباشرة على أبرز المنافسات — كأس العالم، كأس أمم إفريقيا، كأس أمم إفريقيا للسيدات، دوري أبطال أوروبا، وأبرز الدوريات الأوروبية — محدَّثة في ثوانٍ، مباراة بمباراة.',
            'صُمم في المغرب، يذهب ديماسكور أعمق من أي منصة أخرى في تغطية الكرة المغربية. تغطية كاملة للبطولة الاحترافية وكأس العرش، متابعة أسود الأطلس في كأس إفريقيا وكأس العالم، وقسم خاص باللاعبين المغاربة في الخارج.',
            'دون رهانات، دون إعلانات. متعدد اللغات: العربية، الفرنسية، الإنجليزية.',
          ],
        },
        {
          heading: 'ما الذي تحصل عليه',
          body: [
            'نتائج مباشرة وتفاصيل المباريات — محدَّثة كل 15 ثانية أثناء المباراة.',
            'صفحات الفرق واللاعبين، الترتيب، الهدّافون، التشكيلات، وجداول الأدوار الإقصائية.',
            'التوقّعات والتحليلات التحريرية — رأي ديماسكور، وليست حصصًا للرهان.',
          ],
        },
        {
          heading: 'بياناتنا',
          body: [
            'تُجمع بيانات المباريات والفرق واللاعبين من مزوّدين مرخَّصين وتُحدَّث باستمرار. ويختلف عمق التغطية حسب المنافسة.',
          ],
        },
      ],
    },
    privacy: {
      title: 'سياسة الخصوصية',
      description:
        'كيف يجمع ديماسكور بياناتك الشخصية ويستخدمها ويحميها، بما يتوافق مع اللائحة العامة لحماية البيانات (GDPR).',
      sections: [
        {
          heading: 'لمحة عامة',
          body: [
            'توضّح هذه السياسة البيانات التي يجمعها ديماسكور وكيفية استخدامها. نعالج البيانات الشخصية وفقًا للائحة العامة لحماية البيانات في الاتحاد الأوروبي (GDPR).',
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
            `وفقًا للائحة العامة لحماية البيانات (GDPR)، يمكنك طلب الاطّلاع على بياناتك الشخصية أو تصحيحها أو حذفها، والاعتراض على معالجتها أو تقييدها. راسلنا على ${CONTACT_EMAIL}.`,
            'المسؤول عن المعالجة هو REN Technology Limited، شركة مسجّلة في إنجلترا وويلز (رقم الشركة 13694812).',
          ],
        },
      ],
    },
    legal: {
      title: 'إشعار قانوني',
      description: 'معلومات النشر والملكية الفكرية الخاصة بديماسكور.',
      sections: [
        {
          heading: 'الناشر',
          body: [
            'ديماسكور تصدره REN Technology Limited، شركة مسجّلة في إنجلترا وويلز تحت رقم 13694812.',
            `للتواصل: ${CONTACT_EMAIL}`,
          ],
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
          a: 'لا. لا نعرض الحصص إطلاقًا. التوقّعات رأي تحريري — وجهة نظر ديماسكور في المباراة، وليست رهانًا.',
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
