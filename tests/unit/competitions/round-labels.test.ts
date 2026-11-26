import { describe, expect, it } from 'vitest';
import {
  canonicalRoundLabel,
  canonicalRoundSlug,
  frenchRoundLabel,
} from '@/lib/competitions/round-labels';
import { localizeRound } from '@/lib/i18n/feed-labels';
import { slugifyRound } from '@/lib/competitions/paths';
import { resolveRedirectRoundSlug } from '@/lib/competitions/round-redirect';

const UCL = 2;
const TRONE = 822;
const FA = 45;

/** Every distinct feed label seen on the three domestic cups and the UEFA cups. */
const TABLE: { raw: string; en: string; fr: string; ar: string; slug: string }[] = [
  {
    raw: '16th Finals',
    en: 'Round of 32',
    fr: 'Seizièmes de finale',
    ar: 'دور الـ32',
    slug: 'round-of-32',
  },
  {
    raw: '8th Finals',
    en: 'Round of 16',
    fr: 'Huitièmes de finale',
    ar: 'دور الـ16',
    slug: 'round-of-16',
  },
  {
    raw: '32nd Finals',
    en: 'Round of 64',
    fr: '32es de finale',
    ar: 'دور الـ64',
    slug: 'round-of-64',
  },
  {
    raw: '64th Finals',
    en: 'Round of 128',
    fr: '64es de finale',
    ar: 'دور الـ128',
    slug: 'round-of-128',
  },
  {
    raw: '1/8',
    en: 'Round of 16',
    fr: 'Huitièmes de finale',
    ar: 'دور الـ16',
    slug: 'round-of-16',
  },
  {
    raw: '1/8-finals',
    en: 'Round of 16',
    fr: 'Huitièmes de finale',
    ar: 'دور الـ16',
    slug: 'round-of-16',
  },
  {
    raw: '1/16',
    en: 'Round of 32',
    fr: 'Seizièmes de finale',
    ar: 'دور الـ32',
    slug: 'round-of-32',
  },
  {
    raw: '1/16-finals',
    en: 'Round of 32',
    fr: 'Seizièmes de finale',
    ar: 'دور الـ32',
    slug: 'round-of-32',
  },
  {
    raw: '1/128-finals',
    en: 'Round of 256',
    fr: '128es de finale',
    ar: 'دور الـ256',
    slug: 'round-of-256',
  },
  {
    raw: '1/4-finals',
    en: 'Quarter-finals',
    fr: 'Quarts de finale',
    ar: 'ربع النهائي',
    slug: 'quarter-finals',
  },
  {
    raw: '1/2-finals',
    en: 'Semi-finals',
    fr: 'Demi-finales',
    ar: 'نصف النهائي',
    slug: 'semi-finals',
  },
  {
    raw: 'Round of 32',
    en: 'Round of 32',
    fr: 'Seizièmes de finale',
    ar: 'دور الـ32',
    slug: 'round-of-32',
  },
  {
    raw: 'Round of 16',
    en: 'Round of 16',
    fr: 'Huitièmes de finale',
    ar: 'دور الـ16',
    slug: 'round-of-16',
  },
  {
    raw: 'Quarter-finals',
    en: 'Quarter-finals',
    fr: 'Quarts de finale',
    ar: 'ربع النهائي',
    slug: 'quarter-finals',
  },
  {
    raw: 'Semi-finals',
    en: 'Semi-finals',
    fr: 'Demi-finales',
    ar: 'نصف النهائي',
    slug: 'semi-finals',
  },
  {
    raw: 'Semi-Finals',
    en: 'Semi-finals',
    fr: 'Demi-finales',
    ar: 'نصف النهائي',
    slug: 'semi-finals',
  },
  { raw: 'Final', en: 'Final', fr: 'Finale', ar: 'النهائي', slug: 'final' },
  { raw: '4th Round', en: '4th Round', fr: '4e tour', ar: 'الدور الرابع', slug: '4th-round' },
  {
    raw: '1st Qualifying Round',
    en: '1st Qualifying Round',
    fr: '1er tour de qualification',
    ar: 'الدور التأهيلي الأول',
    slug: '1st-qualifying-round',
  },
  {
    raw: '2nd Qualifying Round',
    en: '2nd Qualifying Round',
    fr: '2e tour de qualification',
    ar: 'الدور التأهيلي الثاني',
    slug: '2nd-qualifying-round',
  },
  {
    raw: '3rd Qualifying Round',
    en: '3rd Qualifying Round',
    fr: '3e tour de qualification',
    ar: 'الدور التأهيلي الثالث',
    slug: '3rd-qualifying-round',
  },
  {
    raw: '1st Round Qualifying',
    en: '1st Round Qualifying',
    fr: '1er tour de qualification',
    ar: 'الدور التأهيلي الأول',
    slug: '1st-round-qualifying',
  },
  {
    raw: '1st Round Qualifying Replays',
    en: '1st Round Qualifying Replays',
    fr: '1er tour de qualification (rejoués)',
    ar: 'إعادة الدور التأهيلي الأول',
    slug: '1st-round-qualifying-replays',
  },
  {
    raw: '4th Round Qualifying',
    en: '4th Round Qualifying',
    fr: '4e tour de qualification',
    ar: 'الدور التأهيلي الرابع',
    slug: '4th-round-qualifying',
  },
  { raw: 'Play-offs', en: 'Play-offs', fr: 'Barrages', ar: 'الملحق', slug: 'play-offs' },
  {
    raw: 'Playoff round',
    en: 'Playoff round',
    fr: 'Tour des barrages',
    ar: 'دور الملحق',
    slug: 'playoff-round',
  },
  {
    raw: 'Knockout play-offs',
    en: 'Knockout play-offs',
    fr: 'Barrages à élimination directe',
    ar: 'ملحق الأدوار الإقصائية',
    slug: 'knockout-play-offs',
  },
  {
    raw: 'League Stage - 5',
    en: 'League Stage - 5',
    fr: 'Phase de ligue - journée 5',
    ar: 'مرحلة الدوري - الجولة 5',
    slug: 'league-stage-5',
  },
];

describe('canonical cup / UEFA round labels', () => {
  it.each(TABLE)('$raw', ({ raw, en, fr, ar, slug }) => {
    expect(canonicalRoundLabel(raw)).toBe(en);
    expect(localizeRound(raw, 'en')).toBe(en);
    expect(localizeRound(raw, 'fr')).toBe(fr);
    expect(frenchRoundLabel(raw)).toBe(fr);
    expect(localizeRound(raw, 'ar')).toBe(ar);
    expect(canonicalRoundSlug(raw)).toBe(slug);
    expect(slugifyRound(raw)).toBe(slug);
  });

  it('maps retired slugs the same way as the feed labels', () => {
    expect(canonicalRoundLabel('16th-finals')).toBe('Round of 32');
    expect(canonicalRoundSlug('16th-finals')).toBe('round-of-32');
    expect(canonicalRoundSlug('8th-finals')).toBe('round-of-16');
    expect(canonicalRoundSlug('1-128-finals')).toBe('round-of-256');
    expect(canonicalRoundSlug('1-8-finals')).toBe('round-of-16');
    expect(canonicalRoundSlug('1-16-finals')).toBe('round-of-32');
    expect(slugifyRound('8th-finals')).toBe('round-of-16');
  });

  it('308s old slugs, and sends UEFA 16th-finals to knockout-play-offs in one hop', () => {
    expect(resolveRedirectRoundSlug(TRONE, '16th-finals')).toBe('round-of-32');
    expect(resolveRedirectRoundSlug(TRONE, '8th-finals')).toBe('round-of-16');
    expect(resolveRedirectRoundSlug(FA, '1-128-finals')).toBe('round-of-256');
    expect(resolveRedirectRoundSlug(TRONE, 'round-of-32')).toBeNull();
    expect(resolveRedirectRoundSlug(UCL, '16th-finals')).toBe('knockout-play-offs');
    expect(resolveRedirectRoundSlug(UCL, 'round-of-32')).toBe('knockout-play-offs');
    expect(resolveRedirectRoundSlug(UCL, '8th-finals')).toBe('round-of-16');
    expect(resolveRedirectRoundSlug(UCL, 'round-of-16')).toBeNull();
  });
});
