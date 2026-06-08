/**
 * Backfill Arabic names for ALL national teams (teams.name -> 'ar').
 *
 * API-Football stores English team names only, so national teams render in Latin in the Arabic
 * UI. Clubs already carry Arabic names. This derives Arabic for every national team (senior +
 * youth U17–U23 + women's "W") from a curated country-name map plus suffix rules:
 *   "Algeria U20" -> "الجزائر تحت 20",  "Morocco W" -> "المغرب سيدات".
 * Only fills teams currently missing `ar`; idempotent. Unmapped names are reported, not guessed.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/backfill-national-team-names.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

// Base country (English, as stored — incl. API aliases) → Arabic. Review before shipping.
const COUNTRY_AR: Record<string, string> = {
  Afghanistan: 'أفغانستان',
  Albania: 'ألبانيا',
  Algeria: 'الجزائر',
  'American Samoa': 'ساموا الأمريكية',
  Andorra: 'أندورا',
  Angola: 'أنغولا',
  Anguilla: 'أنغويلا',
  'Antigua and Barbuda': 'أنتيغوا وباربودا',
  Argentina: 'الأرجنتين',
  Armenia: 'أرمينيا',
  Aruba: 'أروبا',
  Australia: 'أستراليا',
  Austria: 'النمسا',
  Azerbaijan: 'أذربيجان',
  Bahamas: 'الباهاما',
  Bahrain: 'البحرين',
  Bangladesh: 'بنغلاديش',
  Barbados: 'بربادوس',
  Belarus: 'بيلاروسيا',
  Belgium: 'بلجيكا',
  Belize: 'بليز',
  Benin: 'بنين',
  Bermuda: 'برمودا',
  Bhutan: 'بوتان',
  Bolivia: 'بوليفيا',
  'Bosnia & Herzegovina': 'البوسنة والهرسك',
  Botswana: 'بوتسوانا',
  Brazil: 'البرازيل',
  'British Virgin Islands': 'جزر العذراء البريطانية',
  Brunei: 'بروناي',
  Bulgaria: 'بلغاريا',
  'Burkina Faso': 'بوركينا فاسو',
  Burundi: 'بوروندي',
  Cambodia: 'كمبوديا',
  Cameroon: 'الكاميرون',
  Canada: 'كندا',
  'Cape Verde Islands': 'الرأس الأخضر',
  'Cayman Islands': 'جزر كايمان',
  'Central African Republic': 'إفريقيا الوسطى',
  Chad: 'تشاد',
  Chile: 'تشيلي',
  China: 'الصين',
  'China PR': 'الصين',
  'Chinese Taipei': 'تايبيه الصينية',
  Colombia: 'كولومبيا',
  Comoros: 'جزر القمر',
  Congo: 'الكونغو',
  'Congo DR': 'الكونغو الديمقراطية',
  'Cook Islands': 'جزر كوك',
  'Costa Rica': 'كوستاريكا',
  Croatia: 'كرواتيا',
  Cuba: 'كوبا',
  Curaçao: 'كوراساو',
  Cyprus: 'قبرص',
  'Czech Republic': 'التشيك',
  "Côte d'Ivoire": 'ساحل العاج',
  Djibouti: 'جيبوتي',
  Dominica: 'دومينيكا',
  'Dominican Republic': 'جمهورية الدومينيكان',
  Ecuador: 'الإكوادور',
  Egypt: 'مصر',
  'El Salvador': 'السلفادور',
  England: 'إنجلترا',
  'Equatorial Guinea': 'غينيا الاستوائية',
  Eritrea: 'إريتريا',
  Estonia: 'إستونيا',
  Eswatini: 'إسواتيني',
  Ethiopia: 'إثيوبيا',
  'FYR Macedonia': 'مقدونيا الشمالية',
  'North Macedonia': 'مقدونيا الشمالية',
  'Faroe Islands': 'جزر فارو',
  Fiji: 'فيجي',
  Finland: 'فنلندا',
  France: 'فرنسا',
  Gabon: 'الغابون',
  Gambia: 'غامبيا',
  Georgia: 'جورجيا',
  Germany: 'ألمانيا',
  Ghana: 'غانا',
  Gibraltar: 'جبل طارق',
  Greece: 'اليونان',
  Grenada: 'غرينادا',
  Guam: 'غوام',
  Guatemala: 'غواتيمالا',
  Guinea: 'غينيا',
  'Guinea-Bissau': 'غينيا بيساو',
  Guyana: 'غيانا',
  Haiti: 'هايتي',
  Honduras: 'هندوراس',
  'Hong Kong': 'هونغ كونغ',
  Hungary: 'المجر',
  Iceland: 'آيسلندا',
  India: 'الهند',
  Indonesia: 'إندونيسيا',
  Iran: 'إيران',
  Iraq: 'العراق',
  Israel: 'إسرائيل',
  Italy: 'إيطاليا',
  'Ivory Coast': 'ساحل العاج',
  Jamaica: 'جامايكا',
  Japan: 'اليابان',
  Jordan: 'الأردن',
  Kazakhstan: 'كازاخستان',
  Kenya: 'كينيا',
  'Korea DPR': 'كوريا الشمالية',
  'Korea Republic': 'كوريا الجنوبية',
  Kosovo: 'كوسوفو',
  Kuwait: 'الكويت',
  'Kyrgyz Republic': 'قيرغيزستان',
  Kyrgyzstan: 'قيرغيزستان',
  Laos: 'لاوس',
  Latvia: 'لاتفيا',
  Lebanon: 'لبنان',
  Lesotho: 'ليسوتو',
  Liberia: 'ليبيريا',
  Libya: 'ليبيا',
  Liechtenstein: 'ليختنشتاين',
  Lithuania: 'ليتوانيا',
  Luxembourg: 'لوكسمبورغ',
  Madagascar: 'مدغشقر',
  Malawi: 'مالاوي',
  Malaysia: 'ماليزيا',
  Maldives: 'المالديف',
  Mali: 'مالي',
  Malta: 'مالطا',
  Martinique: 'مارتينيك',
  Mauritania: 'موريتانيا',
  Mauritius: 'موريشيوس',
  Mação: 'ماكاو',
  Mexico: 'المكسيك',
  Moldova: 'مولدوفا',
  Mongolia: 'منغوليا',
  Montenegro: 'الجبل الأسود',
  Morocco: 'المغرب',
  Mozambique: 'موزمبيق',
  Myanmar: 'ميانمار',
  Namibia: 'ناميبيا',
  Nepal: 'نيبال',
  Netherlands: 'هولندا',
  'New Caledonia': 'كاليدونيا الجديدة',
  'New Zealand': 'نيوزيلندا',
  Nicaragua: 'نيكاراغوا',
  Niger: 'النيجر',
  Nigeria: 'نيجيريا',
  'North Korea': 'كوريا الشمالية',
  'Northern Ireland': 'أيرلندا الشمالية',
  Norway: 'النرويج',
  Oman: 'عُمان',
  Pakistan: 'باكستان',
  Palestine: 'فلسطين',
  Panama: 'بنما',
  'Papua New Guinea': 'بابوا غينيا الجديدة',
  Paraguay: 'باراغواي',
  Peru: 'بيرو',
  Philippines: 'الفلبين',
  Poland: 'بولندا',
  Portugal: 'البرتغال',
  'Puerto Rico': 'بورتوريكو',
  Qatar: 'قطر',
  'Rep. Of Ireland': 'أيرلندا',
  'Republic of Ireland': 'أيرلندا',
  Romania: 'رومانيا',
  Russia: 'روسيا',
  Rwanda: 'رواندا',
  Samoa: 'ساموا',
  'San Marino': 'سان مارينو',
  'Saudi Arabia': 'السعودية',
  Senegal: 'السنغال',
  Serbia: 'صربيا',
  Seychelles: 'سيشل',
  'Sierra Leone': 'سيراليون',
  Singapore: 'سنغافورة',
  Slovakia: 'سلوفاكيا',
  Slovenia: 'سلوفينيا',
  'Solomon Islands': 'جزر سليمان',
  Somalia: 'الصومال',
  'South Africa': 'جنوب إفريقيا',
  'South Korea': 'كوريا الجنوبية',
  'South Sudan': 'جنوب السودان',
  Spain: 'إسبانيا',
  'Sri Lanka': 'سريلانكا',
  'St. Kitts and Nevis': 'سانت كيتس ونيفيس',
  'St. Lucia': 'سانت لوسيا',
  'St. Vincent / Grenadines': 'سانت فينسنت والغرينادين',
  Sudan: 'السودان',
  Suriname: 'سورينام',
  Sweden: 'السويد',
  Switzerland: 'سويسرا',
  Syria: 'سوريا',
  Tahiti: 'تاهيتي',
  Tajikistan: 'طاجيكستان',
  Tanzania: 'تنزانيا',
  Thailand: 'تايلاند',
  'Timor-Leste': 'تيمور الشرقية',
  Togo: 'توغو',
  Tonga: 'تونغا',
  'Trinidad and Tobago': 'ترينيداد وتوباغو',
  Tunisia: 'تونس',
  Turkey: 'تركيا',
  Türkiye: 'تركيا',
  Turkmenistan: 'تركمانستان',
  'Turks and Caicos Islands': 'جزر توركس وكايكوس',
  UAE: 'الإمارات',
  'United Arab Emirates': 'الإمارات',
  'US Virgin Islands': 'جزر العذراء الأمريكية',
  USA: 'الولايات المتحدة',
  Uganda: 'أوغندا',
  Ukraine: 'أوكرانيا',
  Uruguay: 'أوروغواي',
  Uzbekistan: 'أوزبكستان',
  Vanuatu: 'فانواتو',
  Venezuela: 'فنزويلا',
  Vietnam: 'فيتنام',
  Wales: 'ويلز',
  Yemen: 'اليمن',
  Zambia: 'زامبيا',
  Zimbabwe: 'زيمبابوي',
};

/** Derive an Arabic name from an English national-team name (handles youth + women's suffixes). */
function deriveArabic(en: string): string | null {
  let base = en;
  let age: string | null = null;
  let women = false;
  const u = base.match(/\s+U(\d{2})$/);
  if (u) {
    age = u[1];
    base = base.slice(0, u.index);
  }
  if (/\s+W$/.test(base)) {
    women = true;
    base = base.replace(/\s+W$/, '');
  }
  const ar = COUNTRY_AR[base.trim()];
  if (!ar) return null;
  return ar + (women ? ' سيدات' : '') + (age ? ` تحت ${age}` : '');
}

async function main(): Promise<void> {
  const res = await db.execute(sql`
    SELECT id, name->>'en' AS en FROM teams
    WHERE is_national = true AND (name->>'ar' IS NULL OR name->>'ar' = '')
  `);
  const rows = res.rows as unknown as { id: string; en: string }[];

  let updated = 0;
  const unmapped: string[] = [];
  for (const r of rows) {
    const ar = deriveArabic(r.en);
    if (!ar) {
      unmapped.push(r.en);
      continue;
    }
    await db.execute(sql`
      UPDATE teams SET name = jsonb_set(name, '{ar}', to_jsonb(${ar}::text), true)
      WHERE id = ${Number(r.id)}
    `);
    updated++;
  }

  console.log(`[ar-names] updated ${updated} national teams`);
  if (unmapped.length) {
    console.warn(
      `[ar-names] unmapped (${unmapped.length}) — add to COUNTRY_AR:\n  ${unmapped.join('\n  ')}`,
    );
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('[ar-names] fatal:', err);
  process.exit(1);
});
