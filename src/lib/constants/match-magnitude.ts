import { FIFA_RANKING_SNAPSHOT, FIFA_TO_ISO2, COUNTRY_META } from './fifa-ranking';

/**
 * Match magnitude — how "featurable" a fixture is, independent of imminence. Drives the landing
 * hero's within-tier ranking (see rankFeaturedMatches). Mirrors how TV/press pick marquee games:
 *   magnitude = clubPrestige(home) + clubPrestige(away)      // big clubs (all covered leagues)
 *             + nationPrestige(home) + nationPrestige(away)  // national teams by FIFA rank
 *             + derbyBonus                                    // curated rivalries
 *             + competitionPrestige + knockoutBoost           // stage of the game
 *
 * The club / derby lists are curated starter data (team-ids from our DB) — refined over time.
 * Morocco priority is NOT hardcoded: Moroccan giants ride CLUB_PRESTIGE (Wydad/Raja are Tier S)
 * and the Atlas Lions ride nationPrestige (Morocco is FIFA #6 → top-10 weight).
 */

interface TeamLike {
  id: number;
  countryCode: string | null;
  isNational: boolean | null;
}
export interface MagnitudeInput {
  homeTeam: TeamLike | null;
  awayTeam: TeamLike | null;
  competition: { id: number };
  round: string | null;
}

// ── Club prestige (team-id → weight) ──
// S = 8 (global/continental giants), A = 5 (elite), B = 2 (big regional).
const S = 8;
const A = 5;
const B = 2;

export const CLUB_PRESTIGE: Record<number, number> = {
  // Europe — S
  541: S, // Real Madrid
  529: S, // Barcelona
  33: S, // Manchester United
  50: S, // Manchester City
  40: S, // Liverpool
  157: S, // Bayern München
  85: S, // Paris Saint Germain
  // Europe — A
  42: A, // Arsenal
  49: A, // Chelsea
  47: A, // Tottenham
  496: A, // Juventus
  505: A, // Inter
  489: A, // AC Milan
  492: A, // Napoli
  165: A, // Borussia Dortmund
  530: A, // Atlético Madrid
  194: A, // Ajax
  197: A, // PSV Eindhoven
  209: A, // Feyenoord
  211: A, // Benfica
  212: A, // FC Porto
  228: A, // Sporting CP
  247: A, // Celtic
  257: A, // Rangers
  // Europe — B
  81: B, // Marseille
  497: B, // AS Roma
  487: B, // Lazio
  536: B, // Sevilla
  34: B, // Newcastle
  66: B, // Aston Villa
  // Morocco
  968: S, // Wydad AC
  976: S, // Raja Casablanca
  969: A, // FAR Rabat
  962: A, // Renaissance Berkane
  3453: B, // Maghreb Fès
  964: B, // Difaa El Jadida
  // Egypt
  1577: S, // Al Ahly
  1040: S, // Zamalek
  1036: A, // Pyramids FC
  1030: B, // Ismaily
  1031: B, // Al Masry
  // Tunisia
  980: S, // ES Tunis (Espérance)
  988: S, // Club Africain
  990: A, // ES Sahel (Étoile du Sahel)
  983: B, // CS Sfaxien
  // Algeria
  906: A, // MC Alger
  910: A, // USM Alger
  904: B, // CR Belouizdad
  918: B, // JS Kabylie
  // Saudi Arabia
  2932: S, // Al-Hilal
  2939: S, // Al-Nassr
  2938: S, // Al-Ittihad
  2929: S, // Al-Ahli Jeddah
  // Turkey
  645: S, // Galatasaray
  611: S, // Fenerbahçe
  549: A, // Beşiktaş
  998: A, // Trabzonspor
  // CAF giants
  2699: B, // Mamelodi Sundowns
  6435: B, // TP Mazembe
};

// ── Derbies (curated rivalry pairs → flat bonus) ──
const DERBY_BONUS = 6;
const DERBIES: ReadonlyArray<readonly [number, number]> = [
  [976, 968], // Casablanca derby (Raja–Wydad)
  [968, 969], // Moroccan Classico (Wydad–FAR)
  [541, 529], // El Clásico
  [541, 530], // Madrid derby
  [50, 33], // Manchester derby
  [40, 33], // North-West derby (Liverpool–Man Utd)
  [42, 47], // North London derby
  [505, 489], // Derby della Madonnina (Inter–Milan)
  [496, 505], // Derby d'Italia (Juventus–Inter)
  [497, 487], // Rome derby
  [157, 165], // Der Klassiker
  [85, 81], // Le Classique
  [1577, 1040], // Cairo derby (Al Ahly–Zamalek)
  [980, 988], // Tunis derby (Espérance–Club Africain)
  [906, 910], // Algiers derby (MC Alger–USM Alger)
  [2932, 2939], // Riyadh derby (Al Hilal–Al Nassr)
  [2938, 2929], // Jeddah "Sea" derby (Al-Ittihad–Al-Ahli)
  [645, 611], // Istanbul derby (Galatasaray–Fenerbahçe)
  [247, 257], // Old Firm (Celtic–Rangers)
  [194, 209], // De Klassieker (Ajax–Feyenoord)
  [211, 212], // O Clássico (Benfica–Porto)
  [211, 228], // Lisbon derby (Benfica–Sporting)
];
const pairKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
const DERBY_KEYS = new Set(DERBIES.map(([a, b]) => pairKey(a, b)));

// ── Competition prestige (competition-id → weight). Unlisted → 1 (a covered top division). ──
const DEFAULT_COMPETITION_PRESTIGE = 1;
export const COMPETITION_PRESTIGE: Record<number, number> = {
  // Tier 1 — global marquee
  1: 10, // World Cup
  2: 10, // UEFA Champions League
  4: 10, // Euro
  9: 9, // Copa América
  15: 9, // FIFA Club World Cup
  913: 9, // Finalissima
  // Tier 2 — elite
  39: 8, // Premier League
  140: 8, // La Liga
  135: 8, // Serie A
  78: 8, // Bundesliga
  61: 8, // Ligue 1
  3: 8, // Europa League
  6: 8, // AFCON
  13: 8, // Copa Libertadores
  5: 7, // Nations League
  29: 7,
  32: 7,
  30: 7,
  31: 7,
  33: 7,
  34: 7,
  37: 7, // WC qualifiers
  // Tier 3 — strong / regionally huge
  12: 6, // CAF Champions League
  20: 6, // CAF Confederation Cup
  848: 6, // Conference League
  17: 6, // AFC Champions League
  307: 6, // Saudi Pro League
  203: 6, // Turkish Süper Lig
  88: 6, // Eredivisie
  94: 6, // Primeira Liga
  262: 6, // Liga MX
  233: 6, // Egyptian Premier League
  179: 6, // Scottish Premiership
  768: 6, // Arab Club Champions Cup
  860: 6, // Arab Cup
  25: 6, // Gulf Cup
  36: 6, // AFCON Qualification
  45: 6, // FA Cup
  143: 6, // Copa del Rey
  81: 6, // DFB-Pokal
  137: 6, // Coppa Italia
  66: 6, // Coupe de France
  // Tier 4 — standard
  200: 3, // Botola Pro
  201: 3, // Botola 2
  822: 3, // Coupe du Trône
  186: 3, // Algeria Ligue 1
  202: 3, // Tunisia Ligue 1
  301: 3, // UAE Pro League
  305: 3, // Qatar Stars League
  144: 3, // Belgian Pro League
  207: 3, // Swiss Super League
  197: 3, // Greek Super League
  210: 3, // Croatian HNL
  286: 3, // Serbian Super Liga
  218: 3, // Austrian Bundesliga
  345: 3, // Czech Liga
  333: 3, // Ukrainian Premier League
  922: 3, // WAFCON
  525: 3, // UWCL
  44: 3, // FA WSL
  531: 3, // UEFA Super Cup
  533: 3, // CAF Super Cup
};

// ── FIFA-rank → nation prestige (built once from the published snapshot) ──
const ISO2_TO_FIFA_RANK: Record<string, number> = (() => {
  const m: Record<string, number> = {};
  for (const row of FIFA_RANKING_SNAPSHOT) {
    const iso2 = COUNTRY_META[row.code]?.iso2 ?? FIFA_TO_ISO2[row.code];
    if (iso2) m[iso2.toLowerCase()] = row.rank;
  }
  return m;
})();

function nationPrestige(team: TeamLike | null): number {
  if (!team?.isNational || !team.countryCode) return 0;
  const rank = ISO2_TO_FIFA_RANK[team.countryCode.toLowerCase()];
  if (!rank) return 0;
  if (rank <= 10) return 8; // top-10 (incl. Morocco #6) — international "big teams"
  if (rank <= 20) return 5;
  if (rank <= 50) return 2;
  return 0;
}

const clubPrestige = (team: TeamLike | null): number => (team ? (CLUB_PRESTIGE[team.id] ?? 0) : 0);

/** Knockout-stage boost (qualifying excluded). Shared by magnitude + the "knockout" tag. */
export function knockoutBoost(round: string | null): number {
  if (!round) return 0;
  const r = round.toLowerCase();
  if (r.includes('qualif')) return 0;
  if (round === 'Final') return 30;
  if (round === '3rd Place Final') return 25;
  if (r.includes('semi-final')) return 20;
  if (r.includes('quarter-final')) return 10;
  if (round === 'Round of 16') return 5;
  if (round === 'Round of 32') return 3;
  return 0;
}

export function isDerby(home: TeamLike | null, away: TeamLike | null): boolean {
  if (!home || !away) return false;
  return DERBY_KEYS.has(pairKey(home.id, away.id));
}

/** Total magnitude score for a fixture — higher = more featurable. */
export function computeMagnitude(f: MagnitudeInput): number {
  return (
    clubPrestige(f.homeTeam) +
    clubPrestige(f.awayTeam) +
    nationPrestige(f.homeTeam) +
    nationPrestige(f.awayTeam) +
    (isDerby(f.homeTeam, f.awayTeam) ? DERBY_BONUS : 0) +
    (COMPETITION_PRESTIGE[f.competition.id] ?? DEFAULT_COMPETITION_PRESTIGE) +
    knockoutBoost(f.round)
  );
}
