import { http, HttpResponse } from 'msw';
import { LEAGUE_IDS, TEAM_IDS } from '@/lib/constants/canonical-ids';

const BASE = 'https://v3.football.api-sports.io';

const RATE_LIMIT_HEADERS = {
  'x-ratelimit-requests-limit': '75000',
  'x-ratelimit-requests-remaining': '74950',
  'x-ratelimit-limit': '450',
  'x-ratelimit-remaining': '449',
};

function apiResponse<T>(get: string, params: Record<string, string | number>, response: T[]) {
  return {
    get,
    parameters: params,
    errors: [],
    results: response.length,
    paging: { current: 1, total: 1 },
    response,
  };
}

export const handlers = [
  // --- Status ---
  http.get(`${BASE}/status`, () => {
    return HttpResponse.json(
      apiResponse('status', {}, [
        {
          account: { firstname: 'Atlas', lastname: 'Kings', email: 'dev@atlaskings.com' },
          subscription: { plan: 'Pro', end: '2027-05-01T00:00:00+00:00', active: true },
          requests: { current: 50, limit_day: 75000 },
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Timezones ---
  http.get(`${BASE}/timezone`, () => {
    return HttpResponse.json(
      apiResponse('timezone', {}, ['Africa/Casablanca', 'Europe/Paris', 'UTC']),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Countries ---
  http.get(`${BASE}/countries`, () => {
    return HttpResponse.json(
      apiResponse('countries', {}, [
        { name: 'Morocco', code: 'MA', flag: 'https://media.api-sports.io/flags/ma.svg' },
        { name: 'France', code: 'FR', flag: 'https://media.api-sports.io/flags/fr.svg' },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Leagues ---
  http.get(`${BASE}/leagues`, () => {
    return HttpResponse.json(
      apiResponse('leagues', {}, [
        {
          league: {
            id: LEAGUE_IDS.BOTOLA_PRO_1,
            name: 'Botola Pro',
            type: 'League',
            logo: `https://media.api-sports.io/football/leagues/${LEAGUE_IDS.BOTOLA_PRO_1}.png`,
          },
          country: {
            name: 'Morocco',
            code: 'MA',
            flag: 'https://media.api-sports.io/flags/ma.svg',
          },
          seasons: [
            {
              year: 2025,
              start: '2025-08-01',
              end: '2026-05-31',
              current: true,
              coverage: {
                fixtures: {
                  events: true,
                  lineups: true,
                  statistics_fixtures: true,
                  statistics_players: true,
                },
                standings: true,
                players: true,
                top_scorers: true,
                top_assists: true,
                top_cards: true,
                injuries: true,
                predictions: true,
                odds: false,
              },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- League seasons ---
  http.get(`${BASE}/leagues/seasons`, () => {
    return HttpResponse.json(apiResponse('leagues/seasons', {}, [2023, 2024, 2025, 2026]), {
      headers: RATE_LIMIT_HEADERS,
    });
  }),

  // --- Venues ---
  http.get(`${BASE}/venues`, () => {
    return HttpResponse.json(
      apiResponse('venues', {}, [
        {
          id: 1031,
          name: 'Complexe Sportif Mohammed V',
          address: null,
          city: 'Casablanca',
          country: 'Morocco',
          capacity: 67000,
          surface: 'grass',
          image: 'https://media.api-sports.io/football/venues/1031.png',
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Teams ---
  http.get(`${BASE}/teams`, () => {
    return HttpResponse.json(
      apiResponse('teams', {}, [
        {
          team: {
            id: TEAM_IDS.WYDAD,
            name: 'Wydad AC',
            code: 'WAC',
            country: 'Morocco',
            founded: 1937,
            national: false,
            logo: `https://media.api-sports.io/football/teams/${TEAM_IDS.WYDAD}.png`,
          },
          venue: {
            id: 1031,
            name: 'Complexe Sportif Mohammed V',
            address: null,
            city: 'Casablanca',
            country: 'Morocco',
            capacity: 67000,
            surface: 'grass',
            image: 'https://media.api-sports.io/football/venues/1031.png',
          },
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Team statistics ---
  http.get(`${BASE}/teams/statistics`, () => {
    return HttpResponse.json(
      apiResponse('teams/statistics', {}, [
        {
          league: { id: LEAGUE_IDS.BOTOLA_PRO_1, name: 'Botola Pro', season: 2025 },
          team: {
            id: TEAM_IDS.WYDAD,
            name: 'Wydad AC',
            logo: `https://media.api-sports.io/football/teams/${TEAM_IDS.WYDAD}.png`,
          },
          form: 'WWDLW',
          fixtures: {
            played: { home: 10, away: 10, total: 20 },
            wins: { home: 7, away: 5, total: 12 },
            draws: { home: 2, away: 2, total: 4 },
            loses: { home: 1, away: 3, total: 4 },
          },
          goals: {
            for: { total: { home: 20, away: 12, total: 32 } },
            against: { total: { home: 8, away: 14, total: 22 } },
          },
          biggest: {
            wins: { home: '4-0', away: '0-3' },
            streak: { wins: 5, draws: 2, loses: 2 },
          },
          lineups: [
            { formation: '4-3-3', played: 15 },
            { formation: '4-4-2', played: 5 },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Team seasons ---
  http.get(`${BASE}/teams/seasons`, () => {
    return HttpResponse.json(apiResponse('teams/seasons', {}, [2022, 2023, 2024, 2025]), {
      headers: RATE_LIMIT_HEADERS,
    });
  }),

  // --- Fixtures ---
  http.get(`${BASE}/fixtures`, ({ request }) => {
    const url = new URL(request.url);
    const live = url.searchParams.get('live');
    if (live) {
      return HttpResponse.json(apiResponse('fixtures', { live: 'all' }, []), {
        headers: RATE_LIMIT_HEADERS,
      });
    }
    return HttpResponse.json(
      apiResponse('fixtures', {}, [
        {
          fixture: {
            id: 1050001,
            referee: 'M. Guezzaz',
            timezone: 'UTC',
            date: '2026-01-15T19:00:00+00:00',
            timestamp: 1768698000,
            periods: { first: 1768698000, second: 1768701600 },
            venue: { id: 1031, name: 'Complexe Sportif Mohammed V', city: 'Casablanca' },
            status: { long: 'Match Finished', short: 'FT', elapsed: 90 },
          },
          league: {
            id: LEAGUE_IDS.BOTOLA_PRO_1,
            name: 'Botola Pro',
            country: 'Morocco',
            logo: null,
            flag: null,
            season: 2025,
            round: 'Regular Season - 20',
          },
          teams: {
            home: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null, winner: true },
            away: { id: TEAM_IDS.RAJA, name: 'Raja CA', logo: null, winner: false },
          },
          goals: { home: 2, away: 1 },
          score: {
            halftime: { home: 1, away: 0 },
            fulltime: { home: 2, away: 1 },
            extratime: { home: null, away: null },
            penalty: { home: null, away: null },
          },
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Fixture rounds ---
  http.get(`${BASE}/fixtures/rounds`, () => {
    return HttpResponse.json(
      apiResponse('fixtures/rounds', {}, [
        'Regular Season - 1',
        'Regular Season - 2',
        'Regular Season - 3',
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Head to head ---
  http.get(`${BASE}/fixtures/headtohead`, () => {
    return HttpResponse.json(apiResponse('fixtures/headtohead', {}, []), {
      headers: RATE_LIMIT_HEADERS,
    });
  }),

  // --- Fixture statistics ---
  http.get(`${BASE}/fixtures/statistics`, () => {
    return HttpResponse.json(
      apiResponse('fixtures/statistics', {}, [
        {
          team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
          statistics: [
            { type: 'Shots on Goal', value: 5 },
            { type: 'Shots off Goal', value: 3 },
            { type: 'Ball Possession', value: '58%' },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Fixture events ---
  http.get(`${BASE}/fixtures/events`, () => {
    return HttpResponse.json(
      apiResponse('fixtures/events', {}, [
        {
          time: { elapsed: 23, extra: null },
          team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
          player: { id: 50001, name: 'A. Jabrane' },
          assist: { id: 50002, name: 'Y. El Hassouni' },
          type: 'Goal',
          detail: 'Normal Goal',
          comments: null,
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Fixture lineups ---
  http.get(`${BASE}/fixtures/lineups`, () => {
    return HttpResponse.json(
      apiResponse('fixtures/lineups', {}, [
        {
          team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null, colors: null },
          formation: '4-3-3',
          coach: { id: 1001, name: 'J. Gamondi', photo: null },
          startXI: Array.from({ length: 11 }, (_, i) => ({
            player: {
              id: 50000 + i,
              name: `Player ${i + 1}`,
              number: i + 1,
              pos: i === 0 ? 'G' : 'M',
              grid: `${Math.floor(i / 4) + 1}:${(i % 4) + 1}`,
            },
          })),
          substitutes: [{ player: { id: 50012, name: 'Sub 1', number: 12, pos: 'G', grid: null } }],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Fixture players ---
  http.get(`${BASE}/fixtures/players`, () => {
    return HttpResponse.json(
      apiResponse('fixtures/players', {}, [
        {
          team: {
            id: TEAM_IDS.WYDAD,
            name: 'Wydad AC',
            logo: null,
            update: '2026-01-15T21:30:00+00:00',
          },
          players: [
            {
              player: { id: 50001, name: 'A. Jabrane', photo: null },
              statistics: [
                {
                  games: { minutes: 90, number: 10, position: 'M', rating: '7.6', captain: true },
                  shots: { total: 3, on: 2 },
                  goals: { total: 1, conceded: 0, assists: 0, saves: 0 },
                  passes: { total: 45, key: 3, accuracy: '82' },
                  tackles: { total: 2, blocks: 0, interceptions: 1 },
                  duels: { total: 10, won: 6 },
                  dribbles: { attempts: 4, success: 3, past: null },
                  fouls: { drawn: 2, committed: 1 },
                  cards: { yellow: 0, yellowred: 0, red: 0 },
                  penalty: { won: null, commited: null, scored: null, missed: null, saved: null },
                },
              ],
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Standings ---
  http.get(`${BASE}/standings`, () => {
    return HttpResponse.json(
      apiResponse('standings', {}, [
        {
          league: {
            id: LEAGUE_IDS.BOTOLA_PRO_1,
            name: 'Botola Pro',
            country: 'Morocco',
            logo: null,
            flag: null,
            season: 2025,
            standings: [
              [
                {
                  rank: 1,
                  team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
                  points: 40,
                  goalsDiff: 10,
                  group: 'Botola Pro',
                  form: 'WWDLW',
                  status: 'same',
                  description: null,
                  all: { played: 20, win: 12, draw: 4, lose: 4, goals: { for: 32, against: 22 } },
                  home: { played: 10, win: 7, draw: 2, lose: 1, goals: { for: 20, against: 8 } },
                  away: { played: 10, win: 5, draw: 2, lose: 3, goals: { for: 12, against: 14 } },
                },
              ],
            ],
          },
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Players ---
  http.get(`${BASE}/players`, () => {
    return HttpResponse.json(
      apiResponse('players', {}, [
        {
          player: {
            id: 50001,
            name: 'Ayoub Jabrane',
            firstname: 'Ayoub',
            lastname: 'Jabrane',
            age: 28,
            birth: { date: '1998-03-15', place: 'Casablanca', country: 'Morocco' },
            nationality: 'Morocco',
            height: '180 cm',
            weight: '75 kg',
            injured: false,
            photo: null,
          },
          statistics: [
            {
              team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
              league: {
                id: LEAGUE_IDS.BOTOLA_PRO_1,
                name: 'Botola Pro',
                country: 'Morocco',
                logo: null,
                flag: null,
                season: 2025,
              },
              games: {
                appearances: 20,
                lineups: 18,
                minutes: 1620,
                number: 10,
                position: 'Midfielder',
                rating: '7.2',
                captain: true,
              },
              substitutes: { in: 2, out: 3, bench: 2 },
              shots: { total: 30, on: 15 },
              goals: { total: 8, conceded: 0, assists: 5, saves: 0 },
              passes: { total: 900, key: 40, accuracy: 82 },
              tackles: { total: 25, blocks: 3, interceptions: 15 },
              duels: { total: 150, won: 90 },
              dribbles: { attempts: 50, success: 35, past: null },
              fouls: { drawn: 30, committed: 15 },
              cards: { yellow: 3, yellowred: 0, red: 0 },
              penalty: { won: 2, commited: 0, scored: 2, missed: 0, saved: 0 },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Player profiles ---
  http.get(`${BASE}/players/profiles`, () => {
    return HttpResponse.json(
      apiResponse('players/profiles', {}, [
        {
          player: {
            id: 50001,
            name: 'Ayoub Jabrane',
            firstname: 'Ayoub',
            lastname: 'Jabrane',
            age: 28,
            birth: { date: '1998-03-15', place: 'Casablanca', country: 'Morocco' },
            nationality: 'Morocco',
            height: '180 cm',
            weight: '75 kg',
            injured: false,
            photo: null,
          },
          statistics: [],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Player squads ---
  http.get(`${BASE}/players/squads`, () => {
    return HttpResponse.json(
      apiResponse('players/squads', {}, [
        {
          team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
          players: [
            {
              id: 50001,
              name: 'A. Jabrane',
              age: 28,
              number: 10,
              position: 'Midfielder',
              photo: null,
            },
            {
              id: 50002,
              name: 'Y. El Hassouni',
              age: 26,
              number: 7,
              position: 'Attacker',
              photo: null,
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Player seasons ---
  http.get(`${BASE}/players/seasons`, () => {
    return HttpResponse.json(apiResponse('players/seasons', {}, [2023, 2024, 2025]), {
      headers: RATE_LIMIT_HEADERS,
    });
  }),

  // --- Top scorers ---
  http.get(`${BASE}/players/topscorers`, () => {
    return HttpResponse.json(
      apiResponse('players/topscorers', {}, [
        {
          player: {
            id: 50001,
            name: 'Ayoub Jabrane',
            firstname: 'Ayoub',
            lastname: 'Jabrane',
            age: 28,
            birth: { date: '1998-03-15', place: 'Casablanca', country: 'Morocco' },
            nationality: 'Morocco',
            height: '180 cm',
            weight: '75 kg',
            injured: false,
            photo: null,
          },
          statistics: [
            {
              team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
              league: {
                id: LEAGUE_IDS.BOTOLA_PRO_1,
                name: 'Botola Pro',
                country: 'Morocco',
                logo: null,
                flag: null,
                season: 2025,
              },
              games: {
                appearances: 20,
                lineups: 18,
                minutes: 1620,
                number: 10,
                position: 'Midfielder',
                rating: '7.2',
                captain: true,
              },
              substitutes: { in: 2, out: 3, bench: 2 },
              shots: { total: 30, on: 15 },
              goals: { total: 12, conceded: 0, assists: 5, saves: 0 },
              passes: { total: 900, key: 40, accuracy: 82 },
              tackles: { total: 25, blocks: 3, interceptions: 15 },
              duels: { total: 150, won: 90 },
              dribbles: { attempts: 50, success: 35, past: null },
              fouls: { drawn: 30, committed: 15 },
              cards: { yellow: 3, yellowred: 0, red: 0 },
              penalty: { won: 2, commited: 0, scored: 2, missed: 0, saved: 0 },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Top assists ---
  http.get(`${BASE}/players/topassists`, () => {
    return HttpResponse.json(
      apiResponse('players/topassists', {}, [
        {
          player: {
            id: 50002,
            name: 'Youssef El Hassouni',
            firstname: 'Youssef',
            lastname: 'El Hassouni',
            age: 26,
            birth: { date: '2000-06-10', place: 'Rabat', country: 'Morocco' },
            nationality: 'Morocco',
            height: '175 cm',
            weight: '70 kg',
            injured: false,
            photo: null,
          },
          statistics: [
            {
              team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
              league: {
                id: LEAGUE_IDS.BOTOLA_PRO_1,
                name: 'Botola Pro',
                country: 'Morocco',
                logo: null,
                flag: null,
                season: 2025,
              },
              games: {
                appearances: 20,
                lineups: 20,
                minutes: 1800,
                number: 7,
                position: 'Attacker',
                rating: '7.0',
                captain: false,
              },
              substitutes: { in: 0, out: 2, bench: 0 },
              shots: { total: 20, on: 10 },
              goals: { total: 5, conceded: 0, assists: 10, saves: 0 },
              passes: { total: 800, key: 50, accuracy: 78 },
              tackles: { total: 15, blocks: 2, interceptions: 10 },
              duels: { total: 120, won: 70 },
              dribbles: { attempts: 60, success: 40, past: null },
              fouls: { drawn: 25, committed: 10 },
              cards: { yellow: 2, yellowred: 0, red: 0 },
              penalty: { won: 1, commited: 0, scored: 0, missed: 0, saved: 0 },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Top yellow cards ---
  http.get(`${BASE}/players/topyellowcards`, () => {
    return HttpResponse.json(
      apiResponse('players/topyellowcards', {}, [
        {
          player: {
            id: 50003,
            name: 'K. Belhaj',
            firstname: 'Karim',
            lastname: 'Belhaj',
            age: 30,
            birth: { date: '1996-01-01', place: 'Fes', country: 'Morocco' },
            nationality: 'Morocco',
            height: '182 cm',
            weight: '78 kg',
            injured: false,
            photo: null,
          },
          statistics: [
            {
              team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
              league: {
                id: LEAGUE_IDS.BOTOLA_PRO_1,
                name: 'Botola Pro',
                country: 'Morocco',
                logo: null,
                flag: null,
                season: 2025,
              },
              games: {
                appearances: 20,
                lineups: 20,
                minutes: 1800,
                number: 4,
                position: 'Defender',
                rating: '6.8',
                captain: false,
              },
              substitutes: { in: 0, out: 1, bench: 0 },
              shots: { total: 5, on: 2 },
              goals: { total: 1, conceded: 0, assists: 0, saves: 0 },
              passes: { total: 600, key: 5, accuracy: 85 },
              tackles: { total: 60, blocks: 10, interceptions: 30 },
              duels: { total: 180, won: 110 },
              dribbles: { attempts: 10, success: 5, past: null },
              fouls: { drawn: 10, committed: 35 },
              cards: { yellow: 9, yellowred: 0, red: 0 },
              penalty: { won: 0, commited: 1, scored: 0, missed: 0, saved: 0 },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Top red cards ---
  http.get(`${BASE}/players/topredcards`, () => {
    return HttpResponse.json(
      apiResponse('players/topredcards', {}, [
        {
          player: {
            id: 50003,
            name: 'K. Belhaj',
            firstname: 'Karim',
            lastname: 'Belhaj',
            age: 30,
            birth: { date: '1996-01-01', place: 'Fes', country: 'Morocco' },
            nationality: 'Morocco',
            height: '182 cm',
            weight: '78 kg',
            injured: false,
            photo: null,
          },
          statistics: [
            {
              team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
              league: {
                id: LEAGUE_IDS.BOTOLA_PRO_1,
                name: 'Botola Pro',
                country: 'Morocco',
                logo: null,
                flag: null,
                season: 2025,
              },
              games: {
                appearances: 20,
                lineups: 20,
                minutes: 1800,
                number: 4,
                position: 'Defender',
                rating: '6.8',
                captain: false,
              },
              substitutes: { in: 0, out: 1, bench: 0 },
              shots: { total: 5, on: 2 },
              goals: { total: 1, conceded: 0, assists: 0, saves: 0 },
              passes: { total: 600, key: 5, accuracy: 85 },
              tackles: { total: 60, blocks: 10, interceptions: 30 },
              duels: { total: 180, won: 110 },
              dribbles: { attempts: 10, success: 5, past: null },
              fouls: { drawn: 10, committed: 35 },
              cards: { yellow: 9, yellowred: 0, red: 2 },
              penalty: { won: 0, commited: 1, scored: 0, missed: 0, saved: 0 },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Coaches ---
  http.get(`${BASE}/coachs`, () => {
    return HttpResponse.json(
      apiResponse('coachs', {}, [
        {
          id: 1001,
          name: 'Juan Gamondi',
          firstname: 'Juan',
          lastname: 'Gamondi',
          age: 55,
          birth: { date: '1971-04-10', place: 'Buenos Aires', country: 'Argentina' },
          nationality: 'Argentina',
          height: null,
          weight: null,
          photo: null,
          team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
          career: [
            {
              team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
              start: '2025-07-01',
              end: null,
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Injuries ---
  http.get(`${BASE}/injuries`, () => {
    return HttpResponse.json(
      apiResponse('injuries', {}, [
        {
          player: {
            id: 50004,
            name: 'S. Amrabat',
            photo: null,
            type: 'Missing Fixture',
            reason: 'Knee Injury',
          },
          team: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
          fixture: {
            id: 1050001,
            timezone: 'UTC',
            date: '2026-01-15T19:00:00+00:00',
            timestamp: 1768698000,
          },
          league: {
            id: LEAGUE_IDS.BOTOLA_PRO_1,
            season: 2025,
            name: 'Botola Pro',
            country: 'Morocco',
            logo: null,
            flag: null,
          },
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Transfers ---
  http.get(`${BASE}/transfers`, () => {
    return HttpResponse.json(
      apiResponse('transfers', {}, [
        {
          player: { id: 50001, name: 'A. Jabrane' },
          update: '2025-07-15T00:00:00+00:00',
          transfers: [
            {
              date: '2025-07-01',
              type: 'Free',
              teams: {
                in: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', logo: null },
                out: { id: TEAM_IDS.RAJA, name: 'Raja CA', logo: null },
              },
            },
          ],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Trophies ---
  http.get(`${BASE}/trophies`, () => {
    return HttpResponse.json(
      apiResponse('trophies', {}, [
        { league: 'Botola Pro', country: 'Morocco', season: '2024/2025', place: 'Winner' },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Sidelined ---
  http.get(`${BASE}/sidelined`, () => {
    return HttpResponse.json(
      apiResponse('sidelined', {}, [
        { type: 'Knee Injury', start: '2026-01-10', end: '2026-02-15' },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),

  // --- Predictions ---
  http.get(`${BASE}/predictions`, () => {
    return HttpResponse.json(
      apiResponse('predictions', {}, [
        {
          predictions: {
            winner: { id: TEAM_IDS.WYDAD, name: 'Wydad AC', comment: 'Win or Draw' },
            win_or_draw: true,
            under_over: '-3.5',
            goals: { home: '1.5', away: '0.8' },
            advice: 'Wydad AC or draw',
            percent: { home: '55%', draw: '25%', away: '20%' },
          },
          league: {
            id: LEAGUE_IDS.BOTOLA_PRO_1,
            name: 'Botola Pro',
            country: 'Morocco',
            logo: '',
            flag: '',
            season: 2025,
          },
          teams: { home: {}, away: {} },
          comparison: {
            form: { home: '80%', away: '60%' },
            att: { home: '75%', away: '65%' },
            def: { home: '70%', away: '60%' },
          },
          h2h: [],
        },
      ]),
      { headers: RATE_LIMIT_HEADERS },
    );
  }),
];
