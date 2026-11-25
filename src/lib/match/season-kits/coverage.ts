/**
 * Rosters and coverage notes for the 2026/27 season-kit catalog.
 *
 * Team ids are API-Football team.id values. Rosters are the teams in DimaScore's 2026/27
 * standings for each league (live /en/competition pages, read 2026-11-25); every id also appears
 * in src/lib/constants/team-names-ar.ts. Man City (50) and Fulham (36) are the hand-curated
 * entries in ../season-kits.ts; every other covered team is in a per-league file here.
 *
 * KIT_COVERAGE_GAPS explains every slot or team left out: a kit is only stored when a source
 * confirms it for 2026/27 and gives a base colour.
 */

export interface LeagueRoster {
  competitionId: number;
  league: string;
  teams: readonly { id: number; name: string }[];
}

export const LEAGUE_ROSTERS: readonly LeagueRoster[] = [
  {
    competitionId: 39,
    league: 'Premier League',
    teams: [
      { id: 42, name: 'Arsenal' },
      { id: 51, name: 'Brighton' },
      { id: 50, name: 'Manchester City' },
      { id: 40, name: 'Liverpool' },
      { id: 35, name: 'Bournemouth' },
      { id: 55, name: 'Brentford' },
      { id: 63, name: 'Leeds' },
      { id: 49, name: 'Chelsea' },
      { id: 45, name: 'Everton' },
      { id: 47, name: 'Tottenham' },
      { id: 64, name: 'Hull City' },
      { id: 66, name: 'Aston Villa' },
      { id: 34, name: 'Newcastle' },
      { id: 1346, name: 'Coventry' },
      { id: 36, name: 'Fulham' },
      { id: 57, name: 'Ipswich' },
      { id: 65, name: 'Nottingham Forest' },
      { id: 746, name: 'Sunderland' },
      { id: 33, name: 'Manchester United' },
      { id: 52, name: 'Crystal Palace' },
    ],
  },
  {
    competitionId: 140,
    league: 'LaLiga',
    teams: [
      { id: 529, name: 'Barcelona' },
      { id: 541, name: 'Real Madrid' },
      { id: 530, name: 'Atletico Madrid' },
      { id: 543, name: 'Real Betis' },
      { id: 548, name: 'Real Sociedad' },
      { id: 536, name: 'Sevilla' },
      { id: 4665, name: 'Racing Santander' },
      { id: 531, name: 'Athletic Club' },
      { id: 542, name: 'Alaves' },
      { id: 533, name: 'Villarreal' },
      { id: 540, name: 'Espanyol' },
      { id: 544, name: 'Deportivo La Coruna' },
      { id: 727, name: 'Osasuna' },
      { id: 538, name: 'Celta Vigo' },
      { id: 539, name: 'Levante' },
      { id: 728, name: 'Rayo Vallecano' },
      { id: 532, name: 'Valencia' },
      { id: 546, name: 'Getafe' },
      { id: 797, name: 'Elche' },
      { id: 535, name: 'Malaga' },
    ],
  },
  {
    competitionId: 135,
    league: 'Serie A',
    teams: [
      { id: 487, name: 'Lazio' },
      { id: 497, name: 'AS Roma' },
      { id: 505, name: 'Inter' },
      { id: 489, name: 'AC Milan' },
      { id: 895, name: 'Como' },
      { id: 496, name: 'Juventus' },
      { id: 512, name: 'Frosinone' },
      { id: 492, name: 'Napoli' },
      { id: 500, name: 'Bologna' },
      { id: 495, name: 'Genoa' },
      { id: 490, name: 'Cagliari' },
      { id: 499, name: 'Atalanta' },
      { id: 503, name: 'Torino' },
      { id: 1579, name: 'Monza' },
      { id: 867, name: 'Lecce' },
      { id: 502, name: 'Fiorentina' },
      { id: 523, name: 'Parma' },
      { id: 488, name: 'Sassuolo' },
      { id: 494, name: 'Udinese' },
      { id: 517, name: 'Venezia' },
    ],
  },
  {
    competitionId: 78,
    league: 'Bundesliga',
    teams: [
      { id: 165, name: 'Borussia Dortmund' },
      { id: 157, name: 'Bayern München' },
      { id: 160, name: 'SC Freiburg' },
      { id: 173, name: 'RB Leipzig' },
      { id: 168, name: 'Bayer Leverkusen' },
      { id: 162, name: 'Werder Bremen' },
      { id: 169, name: 'Eintracht Frankfurt' },
      { id: 172, name: 'VfB Stuttgart' },
      { id: 1660, name: 'SV Elversberg' },
      { id: 170, name: 'FC Augsburg' },
      { id: 167, name: '1899 Hoffenheim' },
      { id: 175, name: 'Hamburger SV' },
      { id: 164, name: 'FSV Mainz 05' },
      { id: 192, name: '1. FC Köln' },
      { id: 185, name: 'SC Paderborn 07' },
      { id: 174, name: 'FC Schalke 04' },
      { id: 182, name: 'Union Berlin' },
      { id: 163, name: 'Borussia Mönchengladbach' },
    ],
  },
  {
    competitionId: 61,
    league: 'Ligue 1',
    teams: [
      { id: 85, name: 'Paris Saint Germain' },
      { id: 114, name: 'Paris FC' },
      { id: 79, name: 'Lille' },
      { id: 80, name: 'Lyon' },
      { id: 81, name: 'Marseille' },
      { id: 106, name: 'Stade Brestois 29' },
      { id: 84, name: 'Nice' },
      { id: 91, name: 'Monaco' },
      { id: 94, name: 'Rennes' },
      { id: 97, name: 'Lorient' },
      { id: 116, name: 'Lens' },
      { id: 96, name: 'Toulouse' },
      { id: 1298, name: 'Le Mans' },
      { id: 110, name: 'Estac Troyes' },
      { id: 108, name: 'Auxerre' },
      { id: 95, name: 'Strasbourg' },
      { id: 77, name: 'Angers' },
      { id: 111, name: 'Le Havre' },
    ],
  },
  {
    competitionId: 200,
    league: 'Botola Pro',
    teams: [
      { id: 971, name: 'Kawkab Marrakech' },
      { id: 22218, name: 'CODM Meknès' },
      { id: 976, name: 'Raja Casablanca' },
      { id: 969, name: 'FAR Rabat' },
      { id: 968, name: 'Wydad AC' },
      { id: 3453, name: 'Maghreb Fès' },
      { id: 974, name: 'Ittihad Tanger' },
      { id: 973, name: 'Hassania Agadir' },
      { id: 962, name: 'Renaissance Berkane' },
      { id: 977, name: 'FUS Rabat' },
      { id: 964, name: 'Difaa EL Jadida' },
      { id: 14806, name: 'UTS Rabat' },
      { id: 18753, name: 'Amal Tiznit' },
      { id: 3458, name: 'Widad Témara' },
      { id: 965, name: 'Moghreb Tetouan' },
      { id: 3449, name: 'CR Khemis Zemamra' },
    ],
  },
];

/** Teams with no catalog entry, or with only some slots, and why. */
export const KIT_COVERAGE_GAPS: Readonly<
  Record<number, { status: 'missing' | 'partial'; reason: string }>
> = {
  63: {
    status: 'missing',
    reason:
      'home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Leeds
  4665: {
    status: 'missing',
    reason:
      "home, away: the infobox kit uses another club's pattern file, so it is not trusted; third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (none)",
  }, // Racing Santander
  542: {
    status: 'missing',
    reason:
      'home, away, third: the template repeats one colour across kits (placeholder), so it is not trusted',
  }, // Alaves
  540: {
    status: 'missing',
    reason:
      'home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Espanyol
  544: {
    status: 'missing',
    reason:
      'home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Deportivo La Coruna
  727: {
    status: 'missing',
    reason:
      'home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Osasuna
  538: {
    status: 'missing',
    reason:
      'home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Celta Vigo
  539: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Levante
  797: {
    status: 'partial',
    reason:
      'left out - home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Elche
  535: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Malaga
  489: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // AC Milan
  895: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Como
  496: {
    status: 'partial',
    reason:
      'left out - home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Juventus
  492: {
    status: 'partial',
    reason:
      'left out - home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Napoli
  495: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Genoa
  499: {
    status: 'partial',
    reason:
      'left out - home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Atalanta
  503: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Torino
  488: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Sassuolo
  494: {
    status: 'partial',
    reason:
      'left out - home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Udinese
  160: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // SC Freiburg
  174: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // FC Schalke 04
  106: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Stade Brestois 29
  97: {
    status: 'partial',
    reason:
      'left out - home: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Lorient
  116: {
    status: 'missing',
    reason:
      'home, away, third: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Lens
  110: {
    status: 'missing',
    reason:
      'home, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_troyes2526h, _troyes2526t); away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Estac Troyes
  108: {
    status: 'partial',
    reason:
      'left out - away: pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess',
  }, // Auxerre
  971: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_kacm1, _kacm2, _kacm3)',
  }, // Kawkab Marrakech
  22218: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_codm1, _codm2, _codm3)',
  }, // CODM Meknès
  976: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_RajaCasablanca2526h, _RajaCasablanca2526a, none)',
  }, // Raja Casablanca
  3453: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_aek1516h, _nike_white, _Nike_black_transparent)',
  }, // Maghreb Fès
  974: {
    status: 'partial',
    reason:
      'left out - home: the season article kit has no base colour or an older-season pattern; home: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_bluestripes)',
  }, // Ittihad Tanger
  973: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_husa1, _husa2, _husa3)',
  }, // Hassania Agadir
  962: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_rsberkane21h, _rsberkane21a, _rsberkane21t)',
  }, // Renaissance Berkane
  977: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_fus1, _fus2, _fus3)',
  }, // FUS Rabat
  964: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_dhj1, _dhj2, _dhj3)',
  }, // Difaa EL Jadida
  14806: {
    status: 'missing',
    reason:
      'home, away, third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)',
  }, // UTS Rabat
  18753: {
    status: 'missing',
    reason:
      'home, away, third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)',
  }, // Amal Tiznit
  3458: {
    status: 'missing',
    reason:
      'home, away: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_redstripes2, none); third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)',
  }, // Widad Témara
  965: {
    status: 'missing',
    reason:
      'home, away, third: not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one (_mat1, _mat2, _mat3)',
  }, // Moghreb Tetouan
  3449: {
    status: 'missing',
    reason:
      'home, away, third: no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)',
  }, // CR Khemis Zemamra
};
