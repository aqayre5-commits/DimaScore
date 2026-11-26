/**
 * Youth and low-coverage fixtures ship players with a null id (and sometimes a
 * null name). Those players must stay distinct, and a missing name must not
 * fall back to the team name.
 */
import { createElement as h } from 'react';
import { renderToString } from 'react-dom/server';
import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import en from '@/lib/i18n/messages/en.json';
import { qk } from '@/lib/query-keys';
import { MatchCentre } from '@/components/match/centre/MatchCentre';
import type { LineupPlayer, MatchEvent, MatchLineup } from '@/lib/db/queries/match-detail';
import { buildIncidents, pitchSide, playerHistory } from '@/lib/match/match-centre';
import {
  isPersistablePlayerId,
  keyLineups,
  mergeEventPerson,
  playerDisplayName,
  providerEventFields,
} from '@/lib/match/player-identity';
import uel from './fixtures/uel-qualifier-no-lineups.json';

const HOME = 21449;
const AWAY = 26071;

function slot(
  id: number | null,
  name: string,
  number: number,
  grid: string,
  pos: string,
): LineupPlayer {
  return { id: id as number, name, number, pos, grid, photoUrl: null, birthDate: null };
}

function lineup(
  teamId: number,
  starters: LineupPlayer[],
  substitutes: LineupPlayer[] = [],
): MatchLineup {
  return { teamId, formation: '4-4-2', coach: null, starters, substitutes };
}

const china = lineup(
  HOME,
  [
    slot(null, 'Jiang Yuhan', 21, '1:1', 'G'),
    slot(656107, 'Zhang Xuyao', 2, '2:1', 'D'),
    slot(null, 'Nan Zixun', 4, '2:2', 'D'),
    slot(653260, 'J. Li', 5, '2:3', 'D'),
    slot(null, 'Jin Yucheng', 3, '2:4', 'D'),
    slot(644417, 'Zhaolei Kuang', 7, '3:1', 'F'),
    slot(null, 'Zhou Yunuo', 6, '3:2', 'M'),
    slot(null, 'Pan Chaowei', 13, '3:3', 'M'),
    slot(659508, 'He Sifan', 11, '3:4', 'M'),
    slot(null, 'Zhao Songyuan', 9, '4:1', 'F'),
    slot(null, 'Wan Xiang', 10, '4:2', 'M'),
  ],
  [slot(null, 'Jin Guancheng', 15, '', 'F'), slot(514770, 'Shuai Weihao', 20, '', 'F')],
);

const fiji = lineup(
  AWAY,
  [
    slot(null, 'Kirikiti Biu', 20, '1:1', 'G'),
    slot(null, 'Somit Maharaj', 12, '2:1', 'D'),
    slot(null, 'Ayush Mani Naidu', 17, '2:2', 'D'),
    slot(null, 'Sialesi Vatanatawake', 2, '2:3', 'D'),
    slot(null, 'Jack Raiyawa', 18, '2:4', 'D'),
    slot(null, 'Ryan Swami', 13, '3:1', 'F'),
    slot(null, 'Maikah Dau', 6, '3:2', 'M'),
    slot(null, 'Kanav Gounder', 3, '3:3', 'D'),
    slot(null, 'Aidan Ali', 19, '3:4', 'M'),
    slot(null, 'Saula Muatini', 15, '4:1', 'F'),
    slot(null, 'Isoa Baselala', 14, '4:2', 'F'),
  ],
  [slot(null, '', 9, '', 'F')],
);

function event(
  partial: Partial<MatchEvent> & Pick<MatchEvent, 'id' | 'minute' | 'type'>,
): MatchEvent {
  return {
    extraMinute: null,
    detail: null,
    comments: null,
    teamId: HOME,
    player: null,
    assist: null,
    ...partial,
  };
}

describe('null player ids stay distinct on the pitch', () => {
  it('keeps every named starter when the provider id is null', () => {
    const keyed = keyLineups([china, fiji]);
    const home = pitchSide(keyed[0]);
    const away = pitchSide(keyed[1]);

    expect(new Set(home.xi).size).toBe(11);
    expect(new Set(away.xi).size).toBe(11);
    expect(home.xi.some((id) => away.xi.includes(id))).toBe(false);

    const homeNames = home.xi.map((id) => home.players[id].name);
    expect(homeNames).toEqual(
      expect.arrayContaining([
        'Jiang Yuhan',
        'Nan Zixun',
        'Jin Yucheng',
        'Zhou Yunuo',
        'Pan Chaowei',
        'Zhao Songyuan',
        'Wan Xiang',
        'Zhang Xuyao',
        'J. Li',
        'Zhaolei Kuang',
        'He Sifan',
      ]),
    );
    expect(home.players[home.xi.find((id) => home.players[id].name === 'Wan Xiang')!].num).toBe(10);
    expect(away.xi.map((id) => away.players[id].name)).toContain('Kirikiti Biu');
    expect(away.xi.map((id) => away.players[id].name)).toContain('Isoa Baselala');
    expect(away.players[away.xi.find((id) => away.players[id].num === 14)!].name).toBe(
      'Isoa Baselala',
    );

    const blank = away.bench.map((id) => away.players[id]);
    expect(blank).toHaveLength(1);
    expect(blank[0].name).toBe('');
    expect(blank[0].num).toBe(9);
  });

  it('does not pile nameless events onto one shirt', () => {
    const keyed = keyLineups([china, fiji]);
    const incidents = buildIncidents(
      [
        event({ id: 1, minute: 3, type: 'Goal', detail: 'Normal Goal' }),
        event({ id: 2, minute: 28, type: 'Goal', detail: 'Normal Goal' }),
        event({ id: 3, minute: 65, type: 'Goal', detail: 'Normal Goal' }),
      ],
      HOME,
      keyed,
      'en',
    );
    const home = pitchSide(keyed[0]);
    for (const id of home.xi) expect(playerHistory(incidents, id)).toEqual([]);
    expect(incidents.map((i) => i.player)).toEqual([null, null, null]);
  });

  it('attaches a named null-id event to that shirt only', () => {
    const keyed = keyLineups([china, fiji]);
    const incidents = buildIncidents(
      [
        event({
          id: 1,
          minute: 72,
          type: 'Goal',
          detail: 'Normal Goal',
          player: { id: null, name: { en: 'Wan Xiang' } },
        }),
        event({
          id: 2,
          minute: 32,
          type: 'Goal',
          detail: 'Own Goal',
          teamId: HOME,
          player: { id: null, name: { en: 'Isoa Baselala' } },
        }),
        event({
          id: 3,
          minute: 73,
          type: 'subst',
          detail: 'Substitution 4',
          player: { id: null, name: { en: 'He Sifan' } },
          assist: { id: null, name: { en: 'Shuai Weihao' } },
        }),
        event({
          id: 4,
          minute: 45,
          type: 'subst',
          detail: 'Substitution 1',
          teamId: AWAY,
          player: { id: null, name: {} },
          assist: { id: null, name: {} },
        }),
      ],
      HOME,
      keyed,
      'en',
    );
    const home = pitchSide(keyed[0]);
    const away = pitchSide(keyed[1]);
    const xiang = home.xi.find((id) => home.players[id].name === 'Wan Xiang')!;
    const baselala = away.xi.find((id) => away.players[id].name === 'Isoa Baselala')!;
    const goal = incidents.find((i) => i.minute === 72)!;
    const ownGoal = incidents.find((i) => i.minute === 32)!;
    expect(goal.player).toBe('Wan Xiang');
    expect(goal.playerId).toBe(xiang);
    expect(playerHistory(incidents, xiang).map((e) => e.minute)).toEqual([72]);
    expect(ownGoal.player).toBe('Isoa Baselala');
    expect(ownGoal.playerId).toBe(baselala);
    expect(playerHistory(incidents, baselala).map((e) => e.kind)).toEqual(['own']);
    expect(
      home.xi.filter((id) => playerHistory(incidents, id).some((e) => e.minute === 72)),
    ).toEqual([xiang]);

    const sub = incidents.find((i) => i.minute === 73)!;
    expect(sub.inName).toBe('Shuai Weihao');
    expect(sub.outName).toBe('He Sifan');
    expect(sub.inId).not.toBe(sub.outId);
    expect(incidents.find((i) => i.minute === 45)!.inName).toBeNull();
    expect(incidents.find((i) => i.minute === 45)!.outName).toBeNull();
  });
});

describe('missing player names', () => {
  it('uses the shirt number, then a caller-supplied label, and never invents one', () => {
    expect(playerDisplayName('Wan Xiang', 10, 'Unknown player')).toBe('Wan Xiang');
    expect(playerDisplayName('  ', 10, 'Unknown player')).toBe('#10');
    expect(playerDisplayName(null, null, 'Unknown player')).toBe('Unknown player');
    expect(playerDisplayName(null, null, 'Unknown player')).not.toBe('China PR U17');
  });

  it('keeps a provider name when the id is null, and prefers a joined name', () => {
    expect(
      providerEventFields({
        player: { id: null, name: 'Wan Xiang' },
        assist: { id: null, name: null },
      }),
    ).toEqual({ playerId: null, playerName: 'Wan Xiang', assistPlayerId: null, assistName: null });
    expect(mergeEventPerson(null, null, 'Wan Xiang')).toEqual({
      id: null,
      name: { en: 'Wan Xiang' },
    });
    expect(mergeEventPerson(644417, { en: 'Zhaolei Kuang' }, 'Kuang')).toEqual({
      id: 644417,
      name: { en: 'Zhaolei Kuang' },
    });
    expect(mergeEventPerson(null, {}, '  ')).toBeNull();
    expect(isPersistablePlayerId(null)).toBe(false);
    expect(isPersistablePlayerId(-1)).toBe(false);
    expect(isPersistablePlayerId(644417)).toBe(true);
  });
});

describe('match centre render', () => {
  it('shows each null-id starter and never the team name as a scorer', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const x = structuredClone(uel) as {
      props: {
        match: {
          id: number;
          home: { id: number; name: string };
          away: { id: number; name: string };
        };
      };
      events: MatchEvent[];
      lineups: MatchLineup[];
      stats: unknown;
    };
    x.props.match.home = { ...x.props.match.home, id: HOME, name: 'China PR U17' };
    x.props.match.away = { ...x.props.match.away, id: AWAY, name: 'Fiji U17' };
    x.lineups = [china, fiji];
    x.events = [
      event({ id: 1, minute: 3, type: 'Goal', detail: 'Normal Goal', teamId: HOME }),
      event({
        id: 2,
        minute: 18,
        type: 'Goal',
        detail: 'Missed Penalty',
        teamId: HOME,
      }),
      event({
        id: 3,
        minute: 23,
        type: 'subst',
        detail: 'Substitution 1',
        teamId: AWAY,
      }),
    ];
    const qc = new QueryClient();
    const id = String(x.props.match.id);
    qc.setQueryData(qk.matchEvents(id), x.events);
    qc.setQueryData(qk.matchLineups(id), x.lineups);
    qc.setQueryData(qk.matchStats(id), { teamStats: [], playerStats: [] });
    const html = renderToString(
      h(NextIntlClientProvider, {
        locale: 'en',
        messages: en,
        timeZone: 'Africa/Casablanca',
        children: h(QueryClientProvider, {
          client: qc,
          children: h(MatchCentre, x.props as never),
        }),
      }),
    );
    for (const name of [
      'Jiang Yuhan',
      'Wan Xiang',
      'Kirikiti Biu',
      'Isoa Baselala',
      'Zhang Xuyao',
    ]) {
      expect(html).toContain(name);
    }
    expect(html).toContain('Unknown player');
    expect(html).toContain('#9');
    const titles = [...html.matchAll(/title="([^"]*)"/g)].map((m) => m[1]);
    expect(titles.some((title) => title.includes('3′') && title.includes('18′'))).toBe(false);
    expect(html).not.toContain('<strong>China PR U17</strong>');
    expect(html).not.toContain('<strong>Fiji U17</strong>');
  });
});
