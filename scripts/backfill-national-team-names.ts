/**
 * Backfill Arabic names for national teams (teams.name -> 'ar').
 *
 * API-Football provides English team names only, so national teams rendered in Latin in the
 * Arabic UI (e.g. "Morocco" instead of "المغرب"). Clubs already carry Arabic names; this fills
 * the gap for the World Cup 2026 nations + qualifiers/opponents from a curated country-name map.
 * Matches by is_national + English name, sets only the `ar` key. Idempotent.
 *
 * Run: pnpm tsx --env-file=.env.local scripts/backfill-national-team-names.ts
 */
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';

// English name (as stored) → Arabic. Standard country names; review before shipping.
const AR_NAMES: Record<string, string> = {
  Algeria: 'الجزائر',
  Argentina: 'الأرجنتين',
  Australia: 'أستراليا',
  Austria: 'النمسا',
  Belgium: 'بلجيكا',
  'Bosnia & Herzegovina': 'البوسنة والهرسك',
  Brazil: 'البرازيل',
  Cameroon: 'الكاميرون',
  Canada: 'كندا',
  'Cape Verde Islands': 'الرأس الأخضر',
  Chile: 'تشيلي',
  Colombia: 'كولومبيا',
  'Congo DR': 'الكونغو الديمقراطية',
  'Costa Rica': 'كوستاريكا',
  Croatia: 'كرواتيا',
  Curaçao: 'كوراساو',
  'Czech Republic': 'التشيك',
  Denmark: 'الدنمارك',
  Ecuador: 'الإكوادور',
  Egypt: 'مصر',
  England: 'إنجلترا',
  France: 'فرنسا',
  Germany: 'ألمانيا',
  Ghana: 'غانا',
  Greece: 'اليونان',
  Haiti: 'هايتي',
  Honduras: 'هندوراس',
  Iceland: 'آيسلندا',
  Iran: 'إيران',
  Iraq: 'العراق',
  Italy: 'إيطاليا',
  'Ivory Coast': 'ساحل العاج',
  Japan: 'اليابان',
  Jordan: 'الأردن',
  Mexico: 'المكسيك',
  Morocco: 'المغرب',
  Netherlands: 'هولندا',
  'New Zealand': 'نيوزيلندا',
  Nigeria: 'نيجيريا',
  'North Korea': 'كوريا الشمالية',
  Norway: 'النرويج',
  Panama: 'بنما',
  Paraguay: 'باراغواي',
  Peru: 'بيرو',
  Poland: 'بولندا',
  Portugal: 'البرتغال',
  Qatar: 'قطر',
  Russia: 'روسيا',
  'Saudi Arabia': 'السعودية',
  Scotland: 'اسكتلندا',
  Senegal: 'السنغال',
  Serbia: 'صربيا',
  Slovakia: 'سلوفاكيا',
  Slovenia: 'سلوفينيا',
  'South Africa': 'جنوب إفريقيا',
  'South Korea': 'كوريا الجنوبية',
  Spain: 'إسبانيا',
  Sweden: 'السويد',
  Switzerland: 'سويسرا',
  Tunisia: 'تونس',
  Türkiye: 'تركيا',
  USA: 'الولايات المتحدة',
  Uruguay: 'أوروغواي',
  Uzbekistan: 'أوزبكستان',
  Wales: 'ويلز',
};

async function main(): Promise<void> {
  let updated = 0;
  const missing: string[] = [];
  for (const [en, ar] of Object.entries(AR_NAMES)) {
    const res = await db.execute(sql`
      UPDATE teams
      SET name = jsonb_set(name, '{ar}', to_jsonb(${ar}::text), true)
      WHERE is_national = true AND name->>'en' = ${en}
    `);
    const n = (res as unknown as { rowCount?: number }).rowCount ?? 0;
    if (n > 0) {
      updated += n;
      console.log(`  ${en} → ${ar}`);
    } else {
      missing.push(en);
    }
  }
  if (missing.length) console.warn(`\n[ar-names] no national team matched: ${missing.join(', ')}`);
  console.log(`\n[ar-names] updated ${updated} national teams`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[ar-names] fatal:', err);
  process.exit(1);
});
