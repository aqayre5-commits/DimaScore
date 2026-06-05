/**
 * FIFA World Cup 2026 squads, as published on fifa.com, for bulk seeding into
 * tournament_squads. Source of truth for scripts/resolve-wc2026-squads.ts
 * (read-only match report) and scripts/seed-wc2026-squads.ts (writes).
 *
 * `dbName` is the team name as stored in our DB (teams.name->>'en'), which can
 * differ from FIFA's label (e.g. Czechia -> Czech Republic, Korea Republic ->
 * South Korea). Teams whose squad isn't published yet are simply omitted — the
 * Squad tab falls back to whatever we have in the DB.
 *
 * Morocco is already seeded via scripts/seed-tournament-squad-morocco-wc2026.ts
 * (hand-resolved) and is intentionally not duplicated here.
 */

export type SquadPos = 'GK' | 'DEF' | 'MID' | 'FWD';

export interface SquadEntry {
  name: string;
  pos: SquadPos;
}

export interface NationSquad {
  fifaName: string;
  dbName: string;
  manager?: string;
  players: SquadEntry[];
}

export const WC2026_SEASON = 2026;
export const WC2026_COMPETITION_ID = 1; // "World Cup"

export const WC2026_SQUADS: NationSquad[] = [
  // ── Group A ──
  {
    fifaName: 'Mexico',
    dbName: 'Mexico',
    manager: 'Javier Aguirre',
    players: [
      { name: 'Raul Rangel', pos: 'GK' },
      { name: 'Carlos Acevedo', pos: 'GK' },
      { name: 'Guillermo Ochoa', pos: 'GK' },
      { name: 'Jorge Sanchez', pos: 'DEF' },
      { name: 'Cesar Montes', pos: 'DEF' },
      { name: 'Edson Alvarez', pos: 'DEF' },
      { name: 'Johan Vasquez', pos: 'DEF' },
      { name: 'Israel Reyes', pos: 'DEF' },
      { name: 'Mateo Chavez', pos: 'DEF' },
      { name: 'Jesus Gallardo', pos: 'DEF' },
      { name: 'Erik Lira', pos: 'MID' },
      { name: 'Luis Romo', pos: 'MID' },
      { name: 'Alvaro Fidalgo', pos: 'MID' },
      { name: 'Orbelin Pineda', pos: 'MID' },
      { name: 'Obed Vargas', pos: 'MID' },
      { name: 'Gilberto Mora', pos: 'MID' },
      { name: 'Luis Chavez', pos: 'MID' },
      { name: 'Brian Gutierrez', pos: 'MID' },
      { name: 'Raul Jimenez', pos: 'FWD' },
      { name: 'Alexis Vega', pos: 'FWD' },
      { name: 'Santiago Gimenez', pos: 'FWD' },
      { name: 'Armando Gonzalez', pos: 'FWD' },
      { name: 'Julian Quinones', pos: 'FWD' },
      { name: 'Cesar Huerta', pos: 'FWD' },
      { name: 'Guillermo Martinez', pos: 'FWD' },
      { name: 'Roberto Alvarado', pos: 'FWD' },
    ],
  },
  {
    fifaName: 'Czechia',
    dbName: 'Czech Republic',
    manager: 'Miroslav Koubek',
    players: [
      { name: 'Matej Kovar', pos: 'GK' },
      { name: 'Jindrich Stanek', pos: 'GK' },
      { name: 'Lukas Hornicek', pos: 'GK' },
      { name: 'David Zima', pos: 'DEF' },
      { name: 'Tomas Holes', pos: 'DEF' },
      { name: 'Robin Hranac', pos: 'DEF' },
      { name: 'Vladimir Coufal', pos: 'DEF' },
      { name: 'Stepan Chaloupek', pos: 'DEF' },
      { name: 'Ladislav Krejci', pos: 'DEF' },
      { name: 'David Jurasek', pos: 'DEF' },
      { name: 'Jaroslav Zeleny', pos: 'DEF' },
      { name: 'David Doudera', pos: 'DEF' },
      { name: 'Vladimir Darida', pos: 'MID' },
      { name: 'Lukas Cerv', pos: 'MID' },
      { name: 'Lukas Provod', pos: 'MID' },
      { name: 'Michal Sadilek', pos: 'MID' },
      { name: 'Tomas Soucek', pos: 'MID' },
      { name: 'Alexandr Sojka', pos: 'MID' },
      { name: 'Hugo Sochurek', pos: 'MID' },
      { name: 'Adam Hlozek', pos: 'FWD' },
      { name: 'Patrik Schick', pos: 'FWD' },
      { name: 'Jan Kuchta', pos: 'FWD' },
      { name: 'Mojmir Chytil', pos: 'FWD' },
      { name: 'Pavel Sulc', pos: 'FWD' },
      { name: 'Tomas Chory', pos: 'FWD' },
      { name: 'Denis Visinsky', pos: 'FWD' },
    ],
  },
  {
    fifaName: 'Korea Republic',
    dbName: 'South Korea',
    manager: 'Hong Myung-Bo',
    players: [
      { name: 'Kim Seunggyu', pos: 'GK' },
      { name: 'Song Bumkeun', pos: 'GK' },
      { name: 'Jo Hyeonwoo', pos: 'GK' },
      { name: 'Lee Hanbeom', pos: 'DEF' },
      { name: 'Kim Minjae', pos: 'DEF' },
      { name: 'Kim Taehyeon', pos: 'DEF' },
      { name: 'Lee Taeseok', pos: 'DEF' },
      { name: 'Cho Wije', pos: 'DEF' },
      { name: 'Kim Moonhwan', pos: 'DEF' },
      { name: 'Park Jinseob', pos: 'DEF' },
      { name: 'Seol Youngwoo', pos: 'DEF' },
      { name: 'Jens Castrop', pos: 'DEF' },
      { name: 'Lee Gihyuk', pos: 'MID' },
      { name: 'Hwang Inbeom', pos: 'MID' },
      { name: 'Paik Seungho', pos: 'MID' },
      { name: 'Lee Jaesung', pos: 'MID' },
      { name: 'Hwang Heechan', pos: 'MID' },
      { name: 'Bae Junho', pos: 'MID' },
      { name: 'Lee Kangin', pos: 'MID' },
      { name: 'Yang Hyunjun', pos: 'MID' },
      { name: 'Kim Jingyu', pos: 'MID' },
      { name: 'Eom Jisung', pos: 'MID' },
      { name: 'Lee Donggyeong', pos: 'MID' },
      { name: 'Son Heungmin', pos: 'FWD' },
      { name: 'Cho Guesung', pos: 'FWD' },
      { name: 'Oh Hyeongyu', pos: 'FWD' },
    ],
  },
  // South Africa — squad not published on fifa.com yet; omitted (DB fallback).
];
