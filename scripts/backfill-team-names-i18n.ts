/**
 * Backfill team names for FR and AR locales.
 *
 * Tier 1: WC 2026 48 national teams — curated FR + AR
 * Tier 2: Botola Pro + Botola 2 clubs — curated AR (FR = EN for clubs)
 * Tier 3: All remaining teams — FR = EN (club proper nouns)
 *
 * Usage:
 *   pnpm tsx scripts/backfill-team-names-i18n.ts --dry-run
 *   pnpm tsx scripts/backfill-team-names-i18n.ts --apply
 */

import 'dotenv/config';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import * as schema from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const DRY_RUN = !process.argv.includes('--apply');

// ── Tier 1: WC 2026 national teams (by team ID) ──

const NATIONAL_TEAMS: Record<number, { fr: string; ar: string }> = {
  1532: { fr: 'Algérie', ar: 'الجزائر' },
  26: { fr: 'Argentine', ar: 'الأرجنتين' },
  20: { fr: 'Australie', ar: 'أستراليا' },
  775: { fr: 'Autriche', ar: 'النمسا' },
  1: { fr: 'Belgique', ar: 'بلجيكا' },
  1113: { fr: 'Bosnie-Herzégovine', ar: 'البوسنة والهرسك' },
  6: { fr: 'Brésil', ar: 'البرازيل' },
  5529: { fr: 'Canada', ar: 'كندا' },
  1533: { fr: 'Cap-Vert', ar: 'الرأس الأخضر' },
  8: { fr: 'Colombie', ar: 'كولومبيا' },
  1508: { fr: 'RD Congo', ar: 'الكونغو الديمقراطية' },
  3: { fr: 'Croatie', ar: 'كرواتيا' },
  5530: { fr: 'Curaçao', ar: 'كوراساو' },
  770: { fr: 'Tchéquie', ar: 'التشيك' },
  2382: { fr: 'Équateur', ar: 'الإكوادور' },
  32: { fr: 'Égypte', ar: 'مصر' },
  10: { fr: 'Angleterre', ar: 'إنجلترا' },
  2: { fr: 'France', ar: 'فرنسا' },
  25: { fr: 'Allemagne', ar: 'ألمانيا' },
  1504: { fr: 'Ghana', ar: 'غانا' },
  2386: { fr: 'Haïti', ar: 'هايتي' },
  22: { fr: 'Iran', ar: 'إيران' },
  1567: { fr: 'Irak', ar: 'العراق' },
  1501: { fr: "Côte d'Ivoire", ar: 'ساحل العاج' },
  12: { fr: 'Japon', ar: 'اليابان' },
  1548: { fr: 'Jordanie', ar: 'الأردن' },
  16: { fr: 'Mexique', ar: 'المكسيك' },
  31: { fr: 'Maroc', ar: 'المغرب' },
  1118: { fr: 'Pays-Bas', ar: 'هولندا' },
  4673: { fr: 'Nouvelle-Zélande', ar: 'نيوزيلندا' },
  1090: { fr: 'Norvège', ar: 'النرويج' },
  11: { fr: 'Panama', ar: 'بنما' },
  2380: { fr: 'Paraguay', ar: 'باراغواي' },
  27: { fr: 'Portugal', ar: 'البرتغال' },
  1569: { fr: 'Qatar', ar: 'قطر' },
  23: { fr: 'Arabie saoudite', ar: 'السعودية' },
  1108: { fr: 'Écosse', ar: 'اسكتلندا' },
  13: { fr: 'Sénégal', ar: 'السنغال' },
  1531: { fr: 'Afrique du Sud', ar: 'جنوب أفريقيا' },
  17: { fr: 'Corée du Sud', ar: 'كوريا الجنوبية' },
  9: { fr: 'Espagne', ar: 'إسبانيا' },
  5: { fr: 'Suède', ar: 'السويد' },
  15: { fr: 'Suisse', ar: 'سويسرا' },
  28: { fr: 'Tunisie', ar: 'تونس' },
  777: { fr: 'Türkiye', ar: 'تركيا' },
  2384: { fr: 'États-Unis', ar: 'الولايات المتحدة' },
  7: { fr: 'Uruguay', ar: 'أوروغواي' },
  1568: { fr: 'Ouzbékistan', ar: 'أوزبكستان' },
};

// ── Tier 2: Botola Pro + Botola 2 clubs (by team ID) ──

const MOROCCAN_CLUBS: Record<number, { fr: string; ar: string }> = {
  976: { fr: 'Raja Casablanca', ar: 'الرجاء البيضاوي' },
  968: { fr: 'Wydad AC', ar: 'الوداد الرياضي' },
  969: { fr: 'FAR Rabat', ar: 'الجيش الملكي' },
  3453: { fr: 'Maghreb Fès', ar: 'المغرب الفاسي' },
  962: { fr: 'Renaissance Berkane', ar: 'نهضة بركان' },
  964: { fr: 'Difaa El Jadida', ar: 'الدفاع الجديدي' },
  977: { fr: 'FUS Rabat', ar: 'الفتح الرباطي' },
  973: { fr: 'Hassania Agadir', ar: 'حسنية أكادير' },
  975: { fr: 'Olympique Safi', ar: 'أولمبيك آسفي' },
  979: { fr: 'KAC Kénitra', ar: 'القنيطري' },
  971: { fr: 'Kawkab Marrakech', ar: 'كوكب مراكش' },
  965: { fr: 'Moghreb Tétouan', ar: 'المغرب التطواني' },
  1075: { fr: 'Mouloudia Oujda', ar: 'مولودية وجدة' },
  970: { fr: 'Chabab Atlas Khénifra', ar: 'شباب أطلس خنيفرة' },
  974: { fr: 'Ittihad Tanger', ar: 'اتحاد طنجة' },
  966: { fr: 'Racing de Casablanca', ar: 'الراسينغ البيضاوي' },
  6387: { fr: 'Chabab Mohammédia', ar: 'شباب المحمدية' },
  3449: { fr: 'CR Khemis Zemamra', ar: 'سريع خميس الزمامرة' },
  3450: { fr: 'Chabab Ben Guérir', ar: 'شباب ابن جرير' },
  3451: { fr: 'El Massira', ar: 'المسيرة' },
  3454: { fr: 'Olympique Dcheira', ar: 'أولمبيك الدشيرة' },
  3455: { fr: 'Raja Beni Mellal', ar: 'رجاء بني ملال' },
  3456: { fr: 'Riadi Salmi', ar: 'الرياضي السالمي' },
  3458: { fr: 'Widad Témara', ar: 'وداد تمارة' },
  3459: { fr: 'Wydad Fès', ar: 'وداد فاس' },
  15549: { fr: 'Stade Marocain', ar: 'الملعب المغربي' },
  17716: { fr: 'USM Oujda', ar: 'الاتحاد الرياضي المغربي وجدة' },
  14806: { fr: 'UTS Rabat', ar: 'الاتحاد الرياضي التواركي' },
  18753: { fr: 'Amal Tiznit', ar: 'أمل تيزنيت' },
  22218: { fr: 'CODM Meknès', ar: 'نادي مكناس' },
  25058: { fr: 'Yacoub El Mansour', ar: 'يعقوب المنصور' },
  26496: { fr: 'Union Sportive Boujaad', ar: 'الاتحاد الرياضي بوجعد' },
};

async function main() {
  console.log(`[backfill] ${DRY_RUN ? 'DRY RUN — no DB writes' : 'APPLYING changes to DB'}`);

  // Fetch all teams
  const rows = await db.execute(sql`SELECT id, name FROM teams`);

  const teams = rows.rows as { id: string; name: Record<string, string> }[];
  console.log(`[backfill] Total teams in DB: ${teams.length}`);

  let tier1 = 0;
  let tier2 = 0;
  let tier3 = 0;
  let skipped = 0;

  for (const team of teams) {
    const id = Number(team.id);
    const name = team.name;
    const hasFr = name.fr != null;
    const hasAr = name.ar != null;

    if (hasFr && hasAr) {
      skipped++;
      continue;
    }

    const curated = NATIONAL_TEAMS[id] ?? MOROCCAN_CLUBS[id];

    if (curated) {
      const newName = { ...name };
      if (!hasFr) newName.fr = curated.fr;
      if (!hasAr) newName.ar = curated.ar;

      const tier = NATIONAL_TEAMS[id] ? 'T1-national' : 'T2-moroccan';
      if (NATIONAL_TEAMS[id]) tier1++;
      else tier2++;

      console.log(`  [${tier}] id=${id} "${name.en}" → fr="${newName.fr}" ar="${newName.ar}"`);

      if (!DRY_RUN) {
        await db.update(schema.teams).set({ name: newName }).where(eq(schema.teams.id, id));
      }
    } else {
      // Tier 3: set fr = en for clubs (proper nouns don't change)
      if (!hasFr && name.en) {
        const newName = { ...name, fr: name.en };
        tier3++;

        if (!DRY_RUN) {
          await db.update(schema.teams).set({ name: newName }).where(eq(schema.teams.id, id));
        }
      } else {
        skipped++;
      }
    }
  }

  console.log(`\n[backfill] Done.`);
  console.log(`  Tier 1 (national teams): ${tier1}`);
  console.log(`  Tier 2 (Moroccan clubs): ${tier2}`);
  console.log(`  Tier 3 (FR = EN):        ${tier3}`);
  console.log(`  Skipped (already set):   ${skipped}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[backfill] Fatal error:', err);
    process.exit(1);
  });
