/**
 * Copy for the static footer pages (legal, privacy, terms, cookiePolicy, about, contact, faq).
 *
 * Legal identity (owner's decision, 19 Nov 2026): the data controller and publisher is DimaScore
 * (the operator), a site run by an individual sole operator, not a company; location Manchester,
 * United Kingdom. No person, company, company number or address is named. Keep the prose here (not in the i18n message bundles) so it stays co-located and
 * easy to revise. Legal wording is not legal advice — have it reviewed before relying on it.
 *
 * About, privacy and cookie copy (Revamp R7, Nov 2026) states only what the code does:
 * - no cookies on the public site (next-intl localeCookie is off; the admin session cookie is
 *   /admin only); local storage holds `atlas-theme` and `dimascore:follows` (useFollows);
 * - no analytics, pixels or ads (GTM/GA/Meta Pixel removed in #23);
 * - third parties a visitor's browser talks to: Vercel (hosting), the Soketi real-time server on
 *   Railway (NEXT_PUBLIC_PUSHER_HOST), media.api-sports.io (flag SVGs in Flag.tsx; other images go
 *   through /_next/image), and YouTube privacy-enhanced embeds only after a video is opened;
 * - data from API-Football; refresh cadence from workers/live-poller (15 s) and vercel.json crons.
 * If any of those change, change this copy in the same PR.
 */
import type { Locale } from '@/lib/i18n/config';

/**
 * Public contact and privacy-request address. Confirmed by the owner on 19 Nov 2026:
 * "contact@dimascore.ma works" (dimascore.ma has Zoho MX; dimascore.com has no MX record).
 * Every static page reads it from here; don't hard-code addresses in the copy.
 */
export const CONTACT_EMAIL = 'contact@dimascore.ma';

/**
 * Where the site runs today, as named in the privacy policy ("What is processed when you visit").
 * - site: the Next.js app is deployed on Vercel (vercel.json: crons; responses carry
 *   `server: Vercel` and `x-vercel-id`, checked 19 Nov 2026).
 * - realtime: the Soketi live-score server runs on Railway (NEXT_PUBLIC_PUSHER_HOST; next.config.ts
 *   CSP connect-src, live value soketi-production-4823.up.railway.app).
 * If either host changes (for example a move to Cloudflare), update these values AND re-read the
 * privacy hosting sentences in all three languages (en, fr, ar) in the same PR;
 * tests/unit/seo/trust-pages.test.ts fails if vercel.json or the Railway note disappears while the
 * copy still names them. The cookie policy names no host.
 */
export const HOSTING = { site: 'Vercel', realtime: 'Railway' } as const;

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
            'DimaScore (the operator) is a site run by an individual sole operator; it is not run by a company. Location: Manchester, United Kingdom.',
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
        { heading: 'Contact', body: [`Questions about these terms: ${CONTACT_EMAIL}`] },
      ],
    },
    cookiePolicy: {
      title: 'Cookie policy',
      description:
        'DimaScore sets no cookies on the public site. What it keeps on your device instead, and how to remove it.',
      sections: [
        {
          heading: 'Cookies',
          body: [
            'The public site sets no cookies: no analytics, advertising or tracking cookies. That is why there is no cookie banner.',
          ],
        },
        {
          heading: 'Local storage',
          body: [
            "Your browser's local storage keeps two things: your theme (light or dark) and the teams and competitions you follow. Neither is sent to us.",
          ],
        },
        {
          heading: 'Third-party content',
          body: [
            "Country flags load from API-Football's image server, and videos play through YouTube's privacy-enhanced mode only when you open one. The privacy policy explains what these services receive.",
          ],
        },
        {
          heading: 'Removing it',
          body: [
            "Clear this site's data in your browser settings to remove your theme and the teams and competitions you follow.",
          ],
        },
        {
          heading: 'Contact',
          body: [`Questions about this policy: ${CONTACT_EMAIL}`],
        },
      ],
    },
    about: {
      title: 'About DimaScore',
      description:
        'Who runs DimaScore, what it covers, where the football data comes from and how often it is updated.',
      sections: [
        {
          heading: 'Who we are',
          body: [
            'DimaScore is a football scores and statistics site in French, English and Arabic, built around Moroccan football.',
            'It is run by an individual sole operator, not a company, based in Manchester, United Kingdom.',
          ],
        },
        {
          heading: 'What we cover',
          body: [
            'Moroccan football: Botola Pro, Botola 2 and the Coupe du Trône, the Morocco national teams, and Lions abroad, which follows Moroccan internationals at their clubs.',
            "Africa and the world: AFCON, WAFCON, the CAF Champions League, the World Cup, the UEFA Champions League and Europe's top five leagues.",
            "Match pages with the live score, goals, cards, line-ups and statistics, and before kick-off a probable line-up based on each team's last six matches. Team, player and coach pages, standings, top scorers, squads and knockout brackets.",
          ],
        },
        {
          heading: 'Where the data comes from',
          body: [
            'Fixtures, scores, match events, line-ups, standings and squads come from API-Football, a commercial football data service.',
            'While a match is live, the score updates every 15 seconds. Fixture lists and standings refresh every 30 minutes, top scorers once a day and squads once a week.',
            `Data can be delayed or occasionally wrong. If you spot a mistake, tell us at ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: 'What DimaScore is not',
          body: [
            'DimaScore does not offer betting or odds. It shows no advertising and uses no analytics or advertising trackers.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Privacy policy',
      description:
        'What personal data DimaScore handles, why, who else receives it, and your rights.',
      sections: [
        {
          heading: 'Who is responsible',
          body: [
            'The data controller is DimaScore (the operator), a site run by an individual sole operator; it is not run by a company. Location: Manchester, United Kingdom.',
            `For any privacy question or request, email ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: 'No account, no tracking',
          body: [
            'You can use DimaScore without an account. We use no analytics tools, advertising pixels or tracking cookies, and we do not sell personal data.',
          ],
        },
        {
          heading: 'What is processed when you visit',
          body: [
            `Like any website, each page request carries technical data such as your IP address, browser type and the page you asked for. Our hosting provider, ${HOSTING.site}, processes it to deliver the site and protect it from abuse.`,
            `Live scores reach your browser through our real-time server, hosted on ${HOSTING.realtime}, which receives the same kind of technical data.`,
            'Country flags load directly from the image server of our data provider, API-Football (media.api-sports.io), which receives your IP address when it sends them.',
            "Videos play through YouTube's privacy-enhanced mode (youtube-nocookie.com) and load only when you open one.",
          ],
        },
        {
          heading: 'Stored on your device',
          body: [
            "The public site sets no cookies. Your browser's local storage keeps your light or dark theme and the teams and competitions you follow. This stays on your device and is never sent to us; clearing the site's data in your browser removes it.",
          ],
        },
        {
          heading: 'If you email us',
          body: ['We use your email address and message only to reply to you.'],
        },
        {
          heading: 'Your rights',
          body: [
            `Under the UK GDPR and, where it applies, the EU GDPR, you can ask for access to, correction or deletion of your personal data, and object to or restrict its processing. Email us at ${CONTACT_EMAIL}.`,
            "You can also complain to the UK Information Commissioner's Office (ico.org.uk) or to the data protection authority where you live.",
          ],
        },
        {
          heading: 'Changes',
          body: ['If what we process changes, we will update this page and the date at the top.'],
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
            'DimaScore is published by an individual sole operator; it is not run by a company. Location: Manchester, United Kingdom.',
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
            'DimaScore (l’opérateur) est un site exploité par une personne physique, opérateur individuel ; il n’est pas exploité par une société. Localisation : Manchester, Royaume-Uni.',
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
        { heading: 'Contact', body: [`Questions sur ces conditions : ${CONTACT_EMAIL}`] },
      ],
    },
    cookiePolicy: {
      title: 'Politique relative aux cookies',
      description:
        'DimaScore ne dépose aucun cookie sur le site public. Ce qu’il conserve sur votre appareil à la place, et comment le supprimer.',
      sections: [
        {
          heading: 'Cookies',
          body: [
            'Le site public ne dépose aucun cookie : ni cookie de mesure d’audience, ni cookie publicitaire, ni cookie de suivi. C’est pourquoi il n’y a pas de bandeau cookies.',
          ],
        },
        {
          heading: 'Stockage local',
          body: [
            'Le stockage local de votre navigateur conserve deux choses : votre thème (clair ou sombre) et les équipes et compétitions que vous suivez. Aucune ne nous est envoyée.',
          ],
        },
        {
          heading: 'Contenus tiers',
          body: [
            'Les drapeaux des pays sont chargés depuis le serveur d’images d’API-Football, et les vidéos sont lues via le mode de confidentialité renforcée de YouTube, uniquement lorsque vous en ouvrez une. La politique de confidentialité précise ce que ces services reçoivent.',
          ],
        },
        {
          heading: 'Les supprimer',
          body: [
            'Effacez les données de ce site dans les réglages de votre navigateur pour supprimer votre thème et les équipes et compétitions suivies.',
          ],
        },
        {
          heading: 'Contact',
          body: [`Questions sur cette politique : ${CONTACT_EMAIL}`],
        },
      ],
    },
    about: {
      title: 'À propos de DimaScore',
      description:
        'Qui édite DimaScore, ce que le site couvre, d’où viennent les données et à quelle fréquence elles sont mises à jour.',
      sections: [
        {
          heading: 'Qui sommes-nous',
          body: [
            'DimaScore est un site de résultats et de statistiques de football en français, en anglais et en arabe, centré sur le football marocain.',
            'Il est exploité depuis Manchester, au Royaume-Uni, par une personne physique, opérateur individuel, et non par une société.',
          ],
        },
        {
          heading: 'Ce que nous couvrons',
          body: [
            'Le football marocain : la Botola Pro, la Botola 2 et la Coupe du Trône, les sélections marocaines et la page Lions à l’étranger, qui suit les internationaux marocains dans leurs clubs.',
            'L’Afrique et le monde : la CAN, la CAN féminine, la Ligue des champions de la CAF, la Coupe du monde, la Ligue des champions de l’UEFA et les cinq grands championnats européens.',
            'Des pages de match avec le score en direct, les buts, les cartons, les compositions et les statistiques, et avant le coup d’envoi une composition probable établie à partir des six derniers matchs de chaque équipe. Des pages équipes, joueurs et entraîneurs, les classements, les meilleurs buteurs, les effectifs et les tableaux à élimination directe.',
          ],
        },
        {
          heading: 'D’où viennent les données',
          body: [
            'Le calendrier, les scores, les événements de match, les compositions, les classements et les effectifs proviennent d’API-Football, un service commercial de données football.',
            'Pendant un match en direct, le score est mis à jour toutes les 15 secondes. Le calendrier et les classements sont actualisés toutes les 30 minutes, les meilleurs buteurs une fois par jour et les effectifs une fois par semaine.',
            `Les données peuvent être retardées ou parfois erronées. Si vous repérez une erreur, écrivez-nous à ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: 'Ce que DimaScore n’est pas',
          body: [
            'DimaScore ne propose ni paris ni cotes. Le site n’affiche aucune publicité et n’utilise ni outil de mesure d’audience ni traceur publicitaire.',
          ],
        },
      ],
    },
    privacy: {
      title: 'Politique de confidentialité',
      description:
        'Les données personnelles que traite DimaScore, pourquoi, qui d’autre les reçoit, et vos droits.',
      sections: [
        {
          heading: 'Responsable du traitement',
          body: [
            'Le responsable du traitement est DimaScore (l’opérateur), un site exploité par une personne physique, opérateur individuel ; il n’est pas exploité par une société. Localisation : Manchester, Royaume-Uni.',
            `Pour toute question ou demande relative à vos données, écrivez à ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: 'Sans compte, sans pistage',
          body: [
            'Vous pouvez utiliser DimaScore sans créer de compte. Nous n’utilisons ni outil de mesure d’audience, ni pixel publicitaire, ni cookie de suivi, et nous ne vendons pas de données personnelles.',
          ],
        },
        {
          heading: 'Ce qui est traité lors de votre visite',
          body: [
            `Comme pour tout site web, chaque page demandée transmet des données techniques, comme votre adresse IP, le type de navigateur et la page consultée. Notre hébergeur, ${HOSTING.site}, les traite pour afficher le site et le protéger contre les abus.`,
            `Les scores en direct arrivent dans votre navigateur via notre serveur temps réel, hébergé chez ${HOSTING.realtime}, qui reçoit le même type de données techniques.`,
            'Les drapeaux des pays sont chargés directement depuis le serveur d’images de notre fournisseur de données, API-Football (media.api-sports.io), qui reçoit votre adresse IP lorsqu’il les envoie.',
            'Les vidéos sont lues via le mode de confidentialité renforcée de YouTube (youtube-nocookie.com) et ne se chargent que lorsque vous en ouvrez une.',
          ],
        },
        {
          heading: 'Ce qui est stocké sur votre appareil',
          body: [
            'Le site public ne dépose aucun cookie. Le stockage local de votre navigateur conserve votre thème clair ou sombre et les équipes et compétitions que vous suivez. Ces informations restent sur votre appareil et ne nous sont jamais envoyées ; effacer les données du site dans votre navigateur les supprime.',
          ],
        },
        {
          heading: 'Si vous nous écrivez',
          body: [
            'Nous utilisons votre adresse e-mail et votre message uniquement pour vous répondre.',
          ],
        },
        {
          heading: 'Vos droits',
          body: [
            `En vertu du RGPD britannique et, lorsqu’il s’applique, du RGPD de l’UE, vous pouvez demander l’accès à vos données personnelles, leur rectification ou leur effacement, et vous opposer à leur traitement ou le limiter. Écrivez-nous à ${CONTACT_EMAIL}.`,
            'Vous pouvez aussi saisir l’autorité britannique de protection des données (ICO, ico.org.uk) ou l’autorité de protection des données de votre pays.',
          ],
        },
        {
          heading: 'Modifications',
          body: [
            'Si les données que nous traitons changent, nous mettrons à jour cette page et la date indiquée en haut.',
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
            'DimaScore est édité par une personne physique, opérateur individuel ; il n’est pas exploité par une société. Localisation : Manchester, Royaume-Uni.',
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
            'ديماسكور (المشغّل) موقع يديره فرد بصفته مشغّلًا مستقلًا، ولا تديره شركة. الموقع: مانشستر، المملكة المتحدة.',
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
        { heading: 'اتصل بنا', body: [`أسئلة حول هذه الشروط: ${CONTACT_EMAIL}`] },
      ],
    },
    cookiePolicy: {
      title: 'سياسة ملفات تعريف الارتباط',
      description:
        'لا يضع ديماسكور أي ملفات تعريف ارتباط على الموقع العام. ما يحفظه على جهازك بدلًا منها، وكيف تحذفه.',
      sections: [
        {
          heading: 'ملفات تعريف الارتباط',
          body: [
            'لا يضع الموقع العام أي ملفات تعريف ارتباط: لا لتحليل الزيارات ولا للإعلانات ولا للتتبع. ولهذا لا توجد نافذة موافقة على ملفات تعريف الارتباط.',
          ],
        },
        {
          heading: 'التخزين المحلي',
          body: [
            'يحتفظ التخزين المحلي في متصفحك بأمرين: المظهر (فاتح أو داكن) والفرق والمسابقات التي تتابعها. ولا يُرسَل أيٌّ منهما إلينا.',
          ],
        },
        {
          heading: 'محتوى الأطراف الثالثة',
          body: [
            'تُحمَّل أعلام الدول من خادم الصور لدى API-Football، وتُشغَّل مقاطع الفيديو عبر وضع الخصوصية المحسّنة في يوتيوب فقط عندما تفتح أحدها. توضّح سياسة الخصوصية ما تتلقاه هذه الخدمات.',
          ],
        },
        {
          heading: 'حذفها',
          body: [
            'امسح بيانات هذا الموقع من إعدادات متصفحك لحذف المظهر والفرق والمسابقات التي تتابعها.',
          ],
        },
        {
          heading: 'اتصل بنا',
          body: [`أسئلة حول هذه السياسة: ${CONTACT_EMAIL}`],
        },
      ],
    },
    about: {
      title: 'حول ديماسكور',
      description:
        'من يدير ديماسكور، وما الذي يغطيه، ومن أين تأتي بيانات كرة القدم، وكم مرة تُحدَّث.',
      sections: [
        {
          heading: 'من نحن',
          body: [
            'ديماسكور موقع لنتائج كرة القدم وإحصاءاتها بالعربية والفرنسية والإنجليزية، يضع الكرة المغربية في صلب اهتمامه.',
            'يديره فرد بصفته مشغّلًا مستقلًا، وليس شركة، من مانشستر في المملكة المتحدة.',
          ],
        },
        {
          heading: 'ما الذي نغطيه',
          body: [
            'الكرة المغربية: البطولة الاحترافية والقسم الثاني وكأس العرش، والمنتخبات المغربية، وصفحة «أسود الأطلس بالخارج» التي تتابع الدوليين المغاربة مع أنديتهم.',
            'إفريقيا والعالم: كأس أمم إفريقيا، وكأس أمم إفريقيا للسيدات، ودوري أبطال إفريقيا، وكأس العالم، ودوري أبطال أوروبا، والدوريات الأوروبية الخمسة الكبرى.',
            'صفحات للمباريات تعرض النتيجة المباشرة والأهداف والبطاقات والتشكيلات والإحصاءات، وقبل صافرة البداية تشكيلة متوقعة مبنية على آخر ست مباريات لكل فريق. وصفحات للفرق واللاعبين والمدربين، والترتيب، والهدافين، وقوائم اللاعبين، وأدوار خروج المغلوب.',
          ],
        },
        {
          heading: 'مصدر البيانات',
          body: [
            'تأتي المواعيد والنتائج وأحداث المباريات والتشكيلات والترتيب وقوائم اللاعبين من API-Football، وهي خدمة تجارية لبيانات كرة القدم.',
            'أثناء المباراة المباشرة تُحدَّث النتيجة كل 15 ثانية. ويُحدَّث جدول المباريات والترتيب كل 30 دقيقة، والهدافون مرة في اليوم، وقوائم اللاعبين مرة في الأسبوع.',
            `قد تتأخر البيانات أو تقع فيها أخطاء أحيانًا. إن لاحظت خطأً فراسلنا على ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: 'ما لا يقدّمه ديماسكور',
          body: [
            'لا يقدّم ديماسكور رهانات ولا احتمالات مراهنة، ولا يعرض إعلانات، ولا يستخدم أدوات لتحليل الزيارات أو للتتبع الإعلاني.',
          ],
        },
      ],
    },
    privacy: {
      title: 'سياسة الخصوصية',
      description:
        'ما البيانات الشخصية التي يعالجها ديماسكور، ولماذا، ومن يتلقاها أيضًا، وما حقوقك.',
      sections: [
        {
          heading: 'الجهة المسؤولة',
          body: [
            'الجهة المسؤولة عن معالجة البيانات هي ديماسكور (المشغّل)، وهو موقع يديره فرد بصفته مشغّلًا مستقلًا، ولا تديره شركة. الموقع: مانشستر، المملكة المتحدة.',
            `لأي سؤال أو طلب يتعلق بالخصوصية، راسلنا على ${CONTACT_EMAIL}.`,
          ],
        },
        {
          heading: 'دون حساب ودون تتبّع',
          body: [
            'يمكنك استخدام ديماسكور دون إنشاء حساب. لا نستخدم أدوات لتحليل الزيارات ولا بكسلات إعلانية ولا ملفات تعريف ارتباط للتتبع، ولا نبيع البيانات الشخصية.',
          ],
        },
        {
          heading: 'ما يُعالَج عند زيارتك',
          body: [
            `كما في أي موقع، يحمل كل طلب لصفحة بيانات تقنية مثل عنوان IP الخاص بك ونوع المتصفح والصفحة المطلوبة. ويعالجها مزوّد الاستضافة لدينا، ${HOSTING.site}، لعرض الموقع وحمايته من إساءة الاستخدام.`,
            `تصل النتائج المباشرة إلى متصفحك عبر خادمنا للبث الفوري المستضاف لدى ${HOSTING.realtime}، ويتلقى النوع نفسه من البيانات التقنية.`,
            'تُحمَّل أعلام الدول مباشرة من خادم الصور لدى مزوّد بياناتنا API-Football ‏(media.api-sports.io)، الذي يتلقى عنوان IP الخاص بك عند إرسالها.',
            'تُشغَّل مقاطع الفيديو عبر وضع الخصوصية المحسّنة في يوتيوب (youtube-nocookie.com)، ولا تُحمَّل إلا عندما تفتح أحدها.',
          ],
        },
        {
          heading: 'ما يُحفَظ على جهازك',
          body: [
            'لا يضع الموقع العام أي ملفات تعريف ارتباط. يحتفظ التخزين المحلي في متصفحك بالمظهر الذي اخترته (فاتح أو داكن) وبالفرق والمسابقات التي تتابعها. تبقى هذه المعلومات على جهازك ولا تُرسَل إلينا أبدًا، ويحذفها مسح بيانات الموقع من متصفحك.',
          ],
        },
        {
          heading: 'إذا راسلتنا',
          body: ['نستخدم بريدك الإلكتروني ورسالتك للرد عليك فقط.'],
        },
        {
          heading: 'حقوقك',
          body: [
            `بموجب اللائحة العامة لحماية البيانات في المملكة المتحدة، واللائحة الأوروبية حيث تنطبق، يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها، والاعتراض على معالجتها أو تقييدها. راسلنا على ${CONTACT_EMAIL}.`,
            'يمكنك أيضًا تقديم شكوى إلى مكتب مفوض المعلومات في المملكة المتحدة (ico.org.uk) أو إلى هيئة حماية البيانات في بلدك.',
          ],
        },
        {
          heading: 'التعديلات',
          body: ['إذا تغيّر ما نعالجه من بيانات، سنحدّث هذه الصفحة والتاريخ المذكور في أعلاها.'],
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
            'ينشر ديماسكور فرد بصفته مشغّلًا مستقلًا، ولا تديره شركة. الموقع: مانشستر، المملكة المتحدة.',
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
