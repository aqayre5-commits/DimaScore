/**
 * `sameAs` entity links — Wikipedia URLs for our teams and competitions, so the JSON-LD on
 * team / match / competition pages resolves to the right Knowledge-Graph entity (a strong signal
 * for Google's entity understanding and for AI-search citation).
 *
 * Keyed by our DB ids. Every URL was curl-verified (HTTP 200) against en.wikipedia.org. Curated
 * starter set — the big clubs + major national teams + headline competitions; extend over time.
 * Entities not listed simply emit no `sameAs` (graceful). Wikidata Q-ids are a future enrichment.
 */

const W = (title: string) => `https://en.wikipedia.org/wiki/${title}`;

export const TEAM_SAMEAS: Record<number, string> = {
  // ── Europe — clubs ──
  541: W('Real_Madrid_CF'),
  529: W('FC_Barcelona'),
  33: W('Manchester_United_F.C.'),
  50: W('Manchester_City_F.C.'),
  40: W('Liverpool_F.C.'),
  157: W('FC_Bayern_Munich'),
  85: W('Paris_Saint-Germain_F.C.'),
  42: W('Arsenal_F.C.'),
  49: W('Chelsea_F.C.'),
  47: W('Tottenham_Hotspur_F.C.'),
  496: W('Juventus_FC'),
  505: W('Inter_Milan'),
  489: W('AC_Milan'),
  492: W('SSC_Napoli'),
  165: W('Borussia_Dortmund'),
  530: W('Atlético_Madrid'),
  194: W('AFC_Ajax'),
  197: W('PSV_Eindhoven'),
  209: W('Feyenoord'),
  211: W('S.L._Benfica'),
  212: W('FC_Porto'),
  228: W('Sporting_CP'),
  247: W('Celtic_F.C.'),
  257: W('Rangers_F.C.'),
  81: W('Olympique_de_Marseille'),
  497: W('AS_Roma'),
  487: W('S.S._Lazio'),
  536: W('Sevilla_FC'),
  34: W('Newcastle_United_F.C.'),
  66: W('Aston_Villa_F.C.'),
  // ── Morocco ──
  968: W('Wydad_AC'),
  976: W('Raja_CA'),
  969: W('AS_FAR_(football_club)'),
  962: W('RS_Berkane'),
  3453: W('Maghreb_de_Fès'),
  964: W('Difaâ_Hassani_El_Jadidi'),
  // ── Egypt ──
  1577: W('Al_Ahly_SC'),
  1040: W('Zamalek_SC'),
  1036: W('Pyramids_FC'),
  1030: W('Ismaily_SC'),
  1031: W('Al_Masry_SC'),
  // ── Tunisia ──
  980: W('Espérance_de_Tunis'),
  988: W('Club_Africain'),
  990: W('Étoile_Sportive_du_Sahel'),
  983: W('CS_Sfaxien'),
  // ── Algeria ──
  906: W('MC_Alger'),
  910: W('USM_Alger'),
  904: W('CR_Belouizdad'),
  918: W('JS_Kabylie'),
  // ── Saudi Arabia ──
  2932: W('Al_Hilal_SFC'),
  2939: W('Al_Nassr_FC'),
  2938: W('Al-Ittihad_Club_(Jeddah)'),
  2929: W('Al-Ahli_Saudi_FC'),
  // ── Turkey ──
  645: W('Galatasaray_S.K._(football)'),
  611: W('Fenerbahçe_S.K._(football)'),
  549: W('Beşiktaş_J.K.'),
  998: W('Trabzonspor'),
  // ── CAF giants ──
  2699: W('Mamelodi_Sundowns_F.C.'),
  6435: W('TP_Mazembe'),

  // ── National teams ──
  1563: W('United_Arab_Emirates_national_football_team'),
  26: W('Argentina_national_football_team'),
  775: W('Austria_national_football_team'),
  20: W('Australia_national_soccer_team'),
  1: W('Belgium_national_football_team'),
  1502: W('Burkina_Faso_national_football_team'),
  6: W('Brazil_national_football_team'),
  5529: W('Canada_men%27s_national_soccer_team'),
  15: W('Switzerland_national_football_team'),
  1501: W('Ivory_Coast_national_football_team'),
  1530: W('Cameroon_national_football_team'),
  8: W('Colombia_national_football_team'),
  25: W('Germany_national_football_team'),
  21: W('Denmark_national_football_team'),
  1532: W('Algeria_national_football_team'),
  2382: W('Ecuador_national_football_team'),
  32: W('Egypt_national_football_team'),
  9: W('Spain_national_football_team'),
  2: W('France_national_football_team'),
  10: W('England_national_football_team'),
  1504: W('Ghana_national_football_team'),
  1509: W('Guinea_national_football_team'),
  3: W('Croatia_national_football_team'),
  1567: W('Iraq_national_football_team'),
  22: W('Iran_national_football_team'),
  768: W('Italy_national_football_team'),
  1548: W('Jordan_national_football_team'),
  12: W('Japan_national_football_team'),
  17: W('South_Korea_national_football_team'),
  31: W('Morocco_national_football_team'),
  1500: W('Mali_national_football_team'),
  16: W('Mexico_national_football_team'),
  19: W('Nigeria_national_football_team'),
  1118: W('Netherlands_national_football_team'),
  1090: W('Norway_national_football_team'),
  27: W('Portugal_national_football_team'),
  1569: W('Qatar_national_football_team'),
  23: W('Saudi_Arabia_national_football_team'),
  13: W('Senegal_national_football_team'),
  28: W('Tunisia_national_football_team'),
  777: W('Turkey_national_football_team'),
  2384: W('United_States_men%27s_national_soccer_team'),
  7: W('Uruguay_national_football_team'),
  1531: W('South_Africa_national_football_team'),
};

export const COMPETITION_SAMEAS: Record<number, string> = {
  1: W('FIFA_World_Cup'),
  2: W('UEFA_Champions_League'),
  4: W('UEFA_European_Championship'),
  9: W('Copa_América'),
  15: W('FIFA_Club_World_Cup'),
  5: W('UEFA_Nations_League'),
  6: W('Africa_Cup_of_Nations'),
  3: W('UEFA_Europa_League'),
  13: W('Copa_Libertadores'),
  39: W('Premier_League'),
  140: W('La_Liga'),
  135: W('Serie_A'),
  78: W('Bundesliga'),
  61: W('Ligue_1'),
  12: W('CAF_Champions_League'),
  20: W('CAF_Confederation_Cup'),
  848: W('UEFA_Conference_League'),
  17: W('AFC_Champions_League_Elite'),
  307: W('Saudi_Pro_League'),
  203: W('Süper_Lig'),
  88: W('Eredivisie'),
  94: W('Primeira_Liga'),
  262: W('Liga_MX'),
  233: W('Egyptian_Premier_League'),
  179: W('Scottish_Premiership'),
  200: W('Botola'),
  201: W('Botola_2'),
  822: W('Moroccan_Throne_Cup'),
  186: W('Algerian_Ligue_Professionnelle_1'),
  202: W('Tunisian_Ligue_Professionnelle_1'),
  922: W('Women%27s_Africa_Cup_of_Nations'),
  45: W('FA_Cup'),
  143: W('Copa_del_Rey'),
  81: W('DFB-Pokal'),
  137: W('Coppa_Italia'),
  66: W('Coupe_de_France'),
};

/** Wikipedia sameAs array for a team, or undefined if not curated. */
export function sameAsForTeam(id: number | null | undefined): string[] | undefined {
  if (id == null) return undefined;
  const url = TEAM_SAMEAS[id];
  return url ? [url] : undefined;
}

/** Wikipedia sameAs array for a competition, or undefined if not curated. */
export function sameAsForCompetition(id: number | null | undefined): string[] | undefined {
  if (id == null) return undefined;
  const url = COMPETITION_SAMEAS[id];
  return url ? [url] : undefined;
}
