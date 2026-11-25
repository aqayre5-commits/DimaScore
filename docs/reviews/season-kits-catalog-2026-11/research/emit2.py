import json,re
exec(open('emit.py').read().split("def src_url")[0])
cov=json.load(open('coverage.json'))
def sq(s): return "'"+s.replace('\\','\\\\').replace("'","\\'")+"'"
out=["""/**
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

export const LEAGUE_ROSTERS: readonly LeagueRoster[] = ["""]
for slug,lname,cid,_ in LEAGUES:
    out.append("  {"); out.append(f"    competitionId: {cid},"); out.append(f"    league: {sq(lname)},"); out.append("    teams: [")
    for t in T.values():
        if t['league']==slug: out.append(f"      {{ id: {t['team_id']}, name: {sq(t['name'])} }},")
    out.append("    ],"); out.append("  },")
out.append("];\n")
out.append("/** Teams with no catalog entry, or with only some slots, and why. */")
out.append("export const KIT_COVERAGE_GAPS: Readonly<Record<number, { status: 'missing' | 'partial'; reason: string }>> = {")
def compress(why, status, tid):
    groups={}
    for x in why:
        m=re.search(r"\b(home|away|third)\b",x)
        slot=m.group(1) if m else '?'
        if 'not tagged 2026' in x:
            p=re.search(r"pattern '([^']*)'",x).group(1)
            key=('unconfirmed',None); detail=p
        elif 'pattern-only' in x: key=('patternonly',None); detail=''
        elif x.startswith('no ') and 'in the club infobox' in x: key=('nokit',None); detail=''
        elif 'another club' in x: key=('wrong',None); detail=''
        elif 'placeholder' in x or 'repeats one colour' in x or 'equals the home' in x or 'equals' in x: key=('placeholder',None); detail=''
        elif 'season-page' in x: key=('seasonbad',None); detail=''
        else: key=(x,None); detail=''
        groups.setdefault(key[0],[]).append((slot,detail))
    txt={'unconfirmed':"not confirmed for 2026/27: the only source is a club infobox whose kit pattern file is not a 2026–27 one ({d})",
         'patternonly':"pattern-only kit: the Wikipedia template carries no base colour, so a flat primary would be a guess",
         'nokit':"no kit at all in the Wikipedia club infobox (and no 2026–27 season article with a kit section)",
         'wrong':"the infobox kit uses another club's pattern file, so it is not trusted",
         'placeholder':"the template repeats one colour across kits (placeholder), so it is not trusted",
         'seasonbad':"the season article kit has no base colour or an older-season pattern"}
    parts=[]
    for k,items in groups.items():
        slots=', '.join(dict.fromkeys(sl for sl,_ in items))
        d=', '.join(dd for _,dd in items if dd)
        t=txt.get(k,k)
        if '{d}' in t: t=t.replace('{d}', d or 'none')
        parts.append(f"{slots}: {t}")
    if status=='missing' and not any(g in groups for g in ('patternonly','nokit')): pass
    return '; '.join(parts)
for t in T.values():
    st,why=cov[str(t['team_id'])]
    if st in ('missing','partial'):
        reason=compress(why,st,t['team_id'])
        if st=='partial': reason='left out - '+reason
        out.append(f"  {t['team_id']}: {{ status: {sq(st)}, reason: {sq(reason)} }}, // {t['name']}")
out.append("};")
open(OUT+'/coverage.ts','w').write('\n'.join(out)+'\n')
open(OUT+'/helpers.ts','w').write("""import type { KitPalette } from '../kit-colours';

/** One flat shirt palette; the border matches the number unless a source says otherwise. */
export function k(primary: string, number: string, border: string = number): KitPalette {
  return { primary, number, border };
}
""")
