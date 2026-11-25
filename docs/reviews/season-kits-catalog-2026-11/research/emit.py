import json,re,sys,urllib.parse
exec(open('gen.py').read().split("result={}")[0])   # reuse helpers + data
OUT='/workspace/site-revamps/dimascore.ma/worktrees/season-kits-catalog/src/lib/match/season-kits'
LEAGUES=[('premier-league','Premier League',39,'PREMIER_LEAGUE_KITS'),('la-liga','LaLiga',140,'LA_LIGA_KITS'),('serie-a','Serie A',135,'SERIE_A_KITS'),('bundesliga','Bundesliga',78,'BUNDESLIGA_KITS'),('ligue-1','Ligue 1',61,'LIGUE_1_KITS'),('botola-pro','Botola Pro',200,'BOTOLA_PRO_KITS')]
SHORTNAME={t['team_id']:t['name'] for t in T.values()}
def sq(s): return "'"+s.replace('\\','\\\\').replace("'","\\'")+"'"
def pal(primary,number): return f"k({sq(primary)}, {sq(number)})"
resolved={}  # tid -> dict
for tid,t in T.items():
    if tid in EXISTING: continue
    info=(INFO[str(tid)] or {}).get('kits') or {}
    ctitle=INFO[str(tid)]['article']; sv=SEAS.get(str(tid)); stitle=sv['title'] if sv else None; skits=sv['kits'] if sv else []
    slots={};why={}
    for slot,n,prefix in (('home','1','home'),('away','2','away'),('third','3','third')):
        chosen=None;w=[]
        for k in skits:
            ti=k['title'].lower()
            if ti.startswith(prefix) and not re.search(r'alt',ti):
                body=hexn(k.get('body'))
                if body and not year_old(k.get('pattern_b')): chosen=dict(src='season',k=k,body=body)
                else: w.append(f"season-page {slot} template has no base colour or an old-season pattern ({k.get('pattern_b')})")
                break
        if not chosen:
            if n not in info: w.append(f"no {slot} kit in the club infobox")
            else:
                k=info[n]; body=hexn(k.get('body'))
                if (tid,n) in OVERRIDE_REJECT: w.append(f"{slot} {OVERRIDE_REJECT[(tid,n)]}")
                elif not year_ok_strict(k.get('pattern_b')): w.append(f"infobox {slot} pattern '{k.get('pattern_b') or 'none'}' is not tagged 2026–27, so the kit is not confirmed for this season")
                elif not body: w.append(f"{slot} kit is pattern-only: the template carries no base colour, so a flat primary would be a guess")
                else: chosen=dict(src='infobox',k=k,body=body)
        slots[slot]=chosen;why[slot]=w
    # placeholder / duplicate rules
    have=[s for s in ('home','away','third') if slots[s]]
    if len(have)>=2 and len({slots[s]['body'] for s in have})==1 and len(have)==3:
        for s in have: why[s].append(f'{s} template repeats one colour for every kit (placeholder), so none is trusted'); slots[s]=None
    else:
        h=slots['home']['body'] if slots['home'] else None; a=slots['away']['body'] if slots['away'] else None
        if slots['away'] and slots['home'] and a==h:
            why['away'].append('away colour equals the home colour in the template (placeholder), not used'); slots['away']=None
        if slots['third']:
            tb=slots['third']['body']
            if tb in {slots[s]['body'] for s in ('home','away') if slots[s]}:
                why['third'].append('third colour equals the home/away colour in the template, so it adds nothing; not stored'); slots['third']=None
    # goalkeeper kits (season page only)
    gks=[]
    for k in skits:
        if re.match(r'goalkeeper \d',k['title'].lower()) and hexn(k.get('body')) and not year_old(k.get('pattern_b')):
            b=hexn(k['body'])
            if b not in [g[0] for g in gks]: gks.append((b,k))
    outp=[c['body'] for c in slots.values() if c]
    keep=[]
    for b,k in gks:
        if any(sum((int(b[i:i+2],16)-int(o[i:i+2],16))**2 for i in (1,3,5))**.5<60 for o in outp):
            print('GK dropped (same as outfield shirt):',tid,T[tid]['name'],k['title'],b); continue
        keep.append((b,k))
    gks=keep
    resolved[tid]=dict(slots=slots,why=why,gks=gks[:3],ctitle=ctitle,stitle=stitle)
def src_url(tid,which):
    r=resolved[tid]
    title=r['stitle'] if which=='season' else r['ctitle']
    rv=R['rev'].get(title) or R['rev'].get(title.replace(' ','_'))
    return url_article(title, rv['revid'] if rv else None), (rv['revid'] if rv else None), title
cov={}   # tid -> status
for slug,lname,cid,const in LEAGUES:
    ents=[]
    for t in T.values():
        if t['league']!=slug: continue
        tid=t['team_id']
        if tid in EXISTING: cov[tid]=('existing',[]); continue
        r=resolved[tid]; s=r['slots']
        if not (s['home'] or s['away']): cov[tid]=('missing',[w for k in ('home','away','third') for w in r['why'][k]]); continue
        used_season=any(c and c['src']=='season' for c in s.values()) or bool(r['gks'])
        main_which='season' if used_season else 'club'
        url,revid,title=src_url(tid,main_which)
        srcname=f"Wikipedia: {title}" + (f" (kit templates, rev {revid})" if revid else '')
        notes=[]
        def slot_note(sl,c):
            k=c['k']; p=k.get('pattern_b') or 'n/a'
            sleeves=hexn(k.get('leftarm'))
            n=f"{sl} {c['body']} from the {'season-page' if c['src']=='season' else 'club-infobox'} template (overlay {p} not drawn"
            if sleeves and sleeves!=c['body']: n+=f"; sleeves {sleeves} not drawn"
            return n+")"
        entry_slots={}
        for sl in ('home','away','third'):
            c=s[sl]
            if not c: continue
            num,how=pick_number(c['body'],c['k'].get('socks'),c['k'].get('shorts'))
            c['num']=num;c['how']=how
            notes.append(slot_note(sl,c)+f", number {num} {'= template trim' if how=='trim' else '= black/white for AA'}")
            entry_slots[sl]=pal(c['body'],num)
        if any(c and c['src']=='infobox' for c in s.values()) and used_season:
            iu,_,it=src_url(tid,'club'); notes.append(f"infobox slots cite {iu}")
        miss=[w for k in ('home','away','third') for w in r['why'][k] if k!='third' or True]
        status='full' if (s['home'] and s['away']) else 'partial'
        cov[tid]=(status,[w for k in ('home','away') for w in r['why'][k]] if status=='partial' else [])
        gk=None
        if r['gks']:
            gl=[]
            for i,(b,k) in enumerate(r['gks']):
                num,how=pick_number(b,k.get('socks'),k.get('shorts'))
                gl.append((('home','away','third')[i],pal(b,num),k['title']))
            gk=gl
            notes.append("goalkeeper: season-page GK templates in listed order (first three that differ from the outfield shirts) mapped to home/away/third; the GK kit actually worn is not verified")
        ents.append(dict(tid=tid,name=t['name'],srcname=srcname,url=url,notes=' | '.join(notes),slots=entry_slots,gk=gk,status=status))
    # write league file
    lines=[f"""/**
 * {lname} 2026/27 season kits (API-Football competition {cid}). Generated from cited Wikipedia kit
 * templates on 2026-11-25; see ./README.md for the sourcing rules. Flat primaries only: stripes,
 * hoops, sleeve colours and trim in the source overlay are noted per entry but never drawn.
 * Slots that could not be confirmed for 2026/27 are left out (see ./coverage.ts).
 */
import type {{ SeasonKitSet }} from '../season-kits';
import {{ k }} from './helpers';

export const {const}: readonly SeasonKitSet[] = ["""]
    for e in ents:
        lines.append("  {")
        lines.append(f"    teamId: {e['tid']}, // {e['name']}")
        lines.append("    season: 2026,")
        lines.append(f"    sourceName: {sq(e['srcname'])},")
        lines.append(f"    sourceUrl: {sq(e['url'])},")
        lines.append(f"    notes: {sq(e['notes'])},")
        lines.append("    player: {")
        for sl in ('home','away','third'):
            if sl in e['slots']: lines.append(f"      {sl}: {e['slots'][sl]},")
        lines.append("    },")
        if e['gk']:
            lines.append("    goalkeeper: {")
            for sl,p,tt in e['gk']: lines.append(f"      {sl}: {p}, // {tt}")
            lines.append("    },")
        lines.append("  },")
    lines.append("];")
    open(f"{OUT}/{slug}.ts",'w').write('\n'.join(lines)+'\n')
json.dump({str(k):v for k,v in cov.items()},open('coverage.json','w'),indent=1,ensure_ascii=False)
import collections
for slug,lname,cid,_ in LEAGUES:
    c=collections.Counter(cov[t['team_id']][0] for t in T.values() if t['league']==slug)
    print(lname,dict(c),sum(c.values()))
