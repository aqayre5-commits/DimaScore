import { describe, expect, it } from 'vitest';
import {
  buildGroups,
  groupRules,
  knockoutDraw,
  knockoutPath,
  pathSlot,
  rankThirds,
  isGroupRound,
  isThirdPlaceRound,
  extraKnockoutRounds,
  twoLeggedSlots,
  editionYearLabel,
} from '@/lib/competitions/group-stage';
import { getCompetitionFormat } from '@/lib/competitions/formats';
import { isMissingBestThirdsPath } from '@/lib/competitions/best-thirds-round';
import type { StandingRow } from '@/lib/db/queries';
import type { CupRound } from '@/lib/competitions/domestic-ties';

const row = (
  group: string,
  teamId: number,
  rank: number,
  points: number,
  gd = 0,
  gf = 0,
): StandingRow => ({
  groupLabel: group,
  teamId,
  rank,
  points,
  played: 3,
  won: null,
  drawn: null,
  lost: null,
  goalsFor: gf,
  goalsAgainst: null,
  goalDiff: gd,
  form: null,
  description: null,
  team: null,
});

const round = (label: string, slug: string, ties = 0): CupRound => ({
  label,
  slug,
  earlier: false,
  twoLegged: false,
  fixtures: [],
  ties: Array.from({ length: ties }, (_, i) => ({
    key: `${slug}-${i}`,
    round: label,
    roundSlug: slug,
    twoLegged: false,
    fixtures: [],
    homeTeamId: i * 2 + 1,
    awayTeamId: i * 2 + 2,
  })),
});

describe('group-stage model', () => {
  it('splits tables by group in label order and ranks the best thirds', () => {
    const groups = buildGroups([
      row('Group B', 5, 3, 4, 1, 3),
      row('Group A', 1, 1, 9),
      row('Group A', 2, 3, 4, 0, 4),
      row('Group B', 6, 1, 7),
      row('Group C', 9, 3, 3),
    ]);
    expect(groups.map((g) => g.label)).toEqual(['Group A', 'Group B', 'Group C']);
    expect(groups.map((g) => g.slug)).toEqual(['group-a', 'group-b', 'group-c']);
    expect(buildGroups([row('A', 1, 1, 3)])[0].slug).toBe('group-a');
    const thirds = rankThirds(groups, 2);
    expect(thirds.map((t) => [t.row.teamId, t.rank, t.qualifies])).toEqual([
      [5, 1, true],
      [2, 2, true],
      [9, 3, false],
    ]);
  });

  it('classifies rounds and finds the knockout path from the format', () => {
    expect(isGroupRound('Group Stage - 2')).toBe(true);
    expect(isGroupRound('League Stage - 5')).toBe(true);
    expect(isGroupRound('Round of 16')).toBe(false);
    expect(isThirdPlaceRound('3rd-place-final')).toBe(true);
    expect(pathSlot('quarter-finals')).toBe('quarter-finals');
    expect(pathSlot('knockout-round-play-offs')).toBe('knockout-play-offs');
    const wc = getCompetitionFormat(1, 2026);
    expect(knockoutPath([round('Final', 'final', 1)], wc)).toEqual([
      'round-of-32',
      'round-of-16',
      'quarter-finals',
      'semi-finals',
      'final',
    ]);
    const afcon = getCompetitionFormat(6);
    expect(knockoutPath([], afcon)[0]).toBe('round-of-16');
    // UWCL: play-offs feed quarter-finals of the same size.
    const uwcl = getCompetitionFormat(525, 2026);
    const path = knockoutPath(
      [round('Knockout Round Play-offs', 'knockout-round-play-offs', 4)],
      uwcl,
    );
    expect(path).toEqual(['knockout-play-offs', 'quarter-finals', 'semi-finals', 'final']);
    const draw = knockoutDraw(
      [round('Knockout Round Play-offs', 'knockout-round-play-offs', 4)],
      path,
      (s) => s,
    );
    expect(draw.map((r) => r.ties.length)).toEqual([4, 4, 2, 1]);
  });

  it('keeps preliminary knockouts apart from the path and the groups', () => {
    const extra = extraKnockoutRounds([
      round('1st Round', '1st-round'),
      round('Group Stage - 1', 'group-stage-1'),
      round('Quarter-finals', 'quarter-finals'),
      round('3rd Place Final', '3rd-place-final'),
    ]);
    expect(extra.map((r) => r.slug)).toEqual(['1st-round']);
  });

  it('builds the advancement key for finals, single tables and Nations League divisions', () => {
    const wc = groupRules(getCompetitionFormat(1, 2026), 'round-of-32', null, 4);
    expect(wc.map((r) => [r.range, r.key])).toEqual([
      ['1–2', 'advance'],
      ['3', 'third'],
      ['4', 'out'],
    ]);
    const copa = groupRules(getCompetitionFormat(9, 2024), 'quarter-finals', null, 4);
    expect(copa.map((r) => r.range)).toEqual(['1–2', '3–4']);
    const uwcl = groupRules(getCompetitionFormat(525, 2026), 'knockout-play-offs', null, 18);
    expect(uwcl.map((r) => [r.range, r.key])).toEqual([
      ['1–4', 'advance'],
      ['5–12', 'playoff'],
      ['13–18', 'out'],
    ]);
    expect(groupRules(null, null, 'D', 3).map((r) => r.key)).toEqual([
      'promotion',
      'playoff',
      'stay',
    ]);
  });
});

describe('per-edition format rules', () => {
  it('WAFCON 2024 sends two best thirds to the quarter-finals; 2026 (provider season 2025) has none', () => {
    const f24 = getCompetitionFormat(922, 2024)!;
    expect(f24.groups?.count).toBe(3);
    expect(f24.bestThirdsAdvance).toBe(2);
    expect(knockoutPath([], f24)[0]).toBe('quarter-finals');
    const f26 = getCompetitionFormat(922, 2025)!;
    expect(f26.groups?.count).toBe(4);
    expect(f26.bestThirdsAdvance ?? 0).toBe(0);
    expect(knockoutPath([], f26)[0]).toBe('quarter-finals');
    expect(editionYearLabel(922, 2025)).toBe('2026');
    expect(editionYearLabel(922, 2024)).toBe('2024');
  });

  it('men CAF club finals are two legs; the CAF women final is one match', () => {
    for (const id of [12, 20]) {
      expect(twoLeggedSlots(getCompetitionFormat(id, 2026))).toContain('final');
    }
    expect(twoLeggedSlots(getCompetitionFormat(1164, 2026)).has('final')).toBe(false);
    expect(getCompetitionFormat(1164, 2026)?.groups).toEqual({ count: 2, size: 4 });
  });

  it('UWCL uses the 18-team league phase from 2026/27 and groups before', () => {
    const f = getCompetitionFormat(525, 2026)!;
    expect(f.tableRules?.map((r) => [r.from, r.to, r.key])).toEqual([
      [1, 4, 'advance'],
      [5, 12, 'playoff'],
      [13, 18, 'out'],
    ]);
    expect(getCompetitionFormat(525, 2027)?.tableRules).toBeDefined();
    expect(getCompetitionFormat(525, 2025)?.tableRules).toBeUndefined();
    expect(getCompetitionFormat(525, 2025)?.groups?.count).toBe(4);
  });

  it("Women's Europa Cup 2026/27: every round, qualifying and final included, is two legs", () => {
    const f = getCompetitionFormat(1191, 2026)!;
    expect(f.allRoundsTwoLegged).toBe(true);
    expect(twoLeggedSlots(f).has('final')).toBe(true);
    expect(getCompetitionFormat(1191, 2025)?.allRoundsTwoLegged).toBeUndefined();
  });
});

describe('best-thirds URL existence', () => {
  it('keeps WAFCON 2024 best-thirds and 404s the 2026 edition', () => {
    expect(isMissingBestThirdsPath('/en/competition/caf/wafcon-2024/round/best-thirds')).toBe(
      false,
    );
    expect(
      isMissingBestThirdsPath('/ar/competition/caf/كأس-أمم-إفريقيا-للسيدات-2024/round/best-thirds'),
    ).toBe(false);
    expect(isMissingBestThirdsPath('/en/competition/caf/wafcon-2026/round/best-thirds')).toBe(true);
    expect(isMissingBestThirdsPath('/fr/competition/caf/can-feminine-2026/round/best-thirds')).toBe(
      true,
    );
    expect(isMissingBestThirdsPath('/en/competition/caf/wafcon-2026/2025/round/best-thirds')).toBe(
      true,
    );
  });

  it('does not flag a real best-thirds edition or a different round', () => {
    expect(isMissingBestThirdsPath('/en/competition/world/world-cup-2026/round/best-thirds')).toBe(
      false,
    );
    expect(isMissingBestThirdsPath('/en/competition/caf/wafcon-2026/round/quarter-finals')).toBe(
      false,
    );
    expect(isMissingBestThirdsPath('/en/club/arsenal')).toBe(false);
  });
});
