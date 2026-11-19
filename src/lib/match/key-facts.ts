/**
 * Server-rendered "key facts" row for the top of the match page (Answer-First block): local
 * kick-off with an explicit Morocco time-zone label, venue, round, two headline stats and the
 * head-to-head record. Pure so it can be unit-tested; every fact is omitted when its data is
 * missing (no placeholders, no invented numbers).
 */
import type { Locale } from '@/lib/i18n/config';

export const MOROCCO_TZ = 'Africa/Casablanca';

export interface KeyFact {
  label: string;
  value: string;
  /** ISO timestamp — rendered as <time dateTime> when set. */
  dateTime?: string;
}

const BCP: Record<Locale, string> = { en: 'en-GB', fr: 'fr-MA', ar: 'ar-MA' };

const LABELS = {
  en: {
    kickoff: 'Kick-off',
    venue: 'Venue',
    possession: 'Possession',
    onTarget: 'Shots on target',
    h2h: 'Head-to-head',
    zone: 'Morocco time',
    h2hValue: (p: number, h: number, d: number, a: number, hn: string, an: string) =>
      `${p} meetings: ${hn} ${h}, draws ${d}, ${an} ${a}`,
  },
  fr: {
    kickoff: "Coup d'envoi",
    venue: 'Stade',
    possession: 'Possession',
    onTarget: 'Tirs cadrés',
    h2h: 'Face-à-face',
    zone: 'heure marocaine',
    h2hValue: (p: number, h: number, d: number, a: number, hn: string, an: string) =>
      `${p} matchs : ${hn} ${h}, nuls ${d}, ${an} ${a}`,
  },
  ar: {
    kickoff: 'موعد الانطلاق',
    venue: 'الملعب',
    possession: 'الاستحواذ',
    onTarget: 'تسديدات على المرمى',
    h2h: 'المواجهات المباشرة',
    zone: 'بتوقيت المغرب',
    h2hValue: (p: number, h: number, d: number, a: number, hn: string, an: string) =>
      `${p} مواجهات: ${hn} ${h}، تعادل ${d}، ${an} ${a}`,
  },
} as const;

/** "GMT" or "GMT+1" for Morocco at that instant (Morocco has been on GMT since 20 Sept 2026). */
export function moroccoOffsetLabel(date: Date): string {
  const part = new Intl.DateTimeFormat('en-GB', {
    timeZone: MOROCCO_TZ,
    timeZoneName: 'longOffset',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value;
  if (!part || part === 'GMT') return 'GMT';
  const m = /^GMT([+-])(\d{2}):(\d{2})$/.exec(part);
  if (!m) return part;
  const h = String(Number(m[2]));
  if (h === '0' && m[3] === '00') return 'GMT';
  return `GMT${m[1]}${m[3] === '00' ? h : `${h}:${m[3]}`}`;
}

/** e.g. "Fri 20 Nov 2026, 19:45 Morocco time (GMT)" — always in Morocco time, server-side. */
export function formatMoroccoKickoff(date: Date, locale: Locale): string {
  const when = new Intl.DateTimeFormat(BCP[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: MOROCCO_TZ,
  }).format(date);
  return `${when} ${LABELS[locale].zone} (${moroccoOffsetLabel(date)})`;
}

/** Short date for titles, e.g. "20 Nov" / "20 nov." / "20 نونبر". */
export function formatShortMatchDate(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(BCP[locale], {
    day: 'numeric',
    month: 'short',
    timeZone: MOROCCO_TZ,
  }).format(date);
}

export interface TeamStatsLike {
  teamId: number;
  stats: { type: string; value: number | string | null }[];
}

function statOf(rows: TeamStatsLike[], teamId: number | undefined, type: string) {
  const v = rows.find((r) => r.teamId === teamId)?.stats.find((s) => s.type === type)?.value;
  return v == null || v === '' ? null : String(v);
}

export interface KeyFactsInput {
  locale: Locale;
  kickoffAt: Date;
  venue?: string | null;
  homeId?: number;
  awayId?: number;
  homeName: string;
  awayName: string;
  /** Only pass for live/finished matches. */
  teamStats?: TeamStatsLike[] | null;
  h2h?: { played: number; homeWins: number; draws: number; awayWins: number } | null;
}

export function buildKeyFacts(i: KeyFactsInput): KeyFact[] {
  const L = LABELS[i.locale];
  const facts: KeyFact[] = [
    {
      label: L.kickoff,
      value: formatMoroccoKickoff(i.kickoffAt, i.locale),
      dateTime: i.kickoffAt.toISOString(),
    },
  ];
  if (i.venue) facts.push({ label: L.venue, value: i.venue });
  const stats = i.teamStats ?? [];
  if (stats.length >= 2) {
    const ph = statOf(stats, i.homeId, 'Ball Possession');
    const pa = statOf(stats, i.awayId, 'Ball Possession');
    if (ph && pa) facts.push({ label: L.possession, value: `${ph} – ${pa}` });
    const sh = statOf(stats, i.homeId, 'Shots on Goal');
    const sa = statOf(stats, i.awayId, 'Shots on Goal');
    if (sh && sa) facts.push({ label: L.onTarget, value: `${sh} – ${sa}` });
  }
  if (i.h2h && i.h2h.played > 0) {
    facts.push({
      label: L.h2h,
      value: L.h2hValue(
        i.h2h.played,
        i.h2h.homeWins,
        i.h2h.draws,
        i.h2h.awayWins,
        i.homeName,
        i.awayName,
      ),
    });
  }
  return facts;
}
