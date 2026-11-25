import json,re,urllib.parse,sys
T={t['team_id']:t for t in json.load(open('teams.json'))}
INFO=json.load(open('club_infobox_kits.json'))
SEAS=json.load(open('wp_kits_raw.json'))
R=json.load(open('revids.json'))
EXISTING={50,36}  # Manchester City, Fulham: hand-curated in season-kits.ts (#67)
def hexn(v):
    if v is None: return None
    v=v.strip().lstrip('#')
    if re.fullmatch(r'[0-9a-fA-F]{3}',v): v=''.join(c*2 for c in v)
    return '#'+v.lower() if re.fullmatch(r'[0-9a-fA-F]{6}',v) else None
def lum(h):
    f=lambda c:(c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4)
    r,g,b=[int(h[i:i+2],16)/255 for i in (1,3,5)]
    return .2126*f(r)+.7152*f(g)+.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); hi,lo=max(la,lb),min(la,lb); return (hi+.05)/(lo+.05)
def pick_number(primary,*trim):
    for t in trim:
        t=hexn(t)
        if t and cr(primary,t)>=4.5: return t,'trim'
    # prefer the repo's soft black/white; fall back to pure black/white when neither reaches AA
    best=None
    for c in ('#111111','#f5f5f5'):
        if cr(primary,c)>=4.5 and (best is None or cr(primary,c)>cr(primary,best)): best=c
    if best: return best,'bw'
    return ('#000000' if cr(primary,'#000000')>=cr(primary,'#ffffff') else '#ffffff'),'bw'
def url_article(title,revid=None):
    t=urllib.parse.quote(title.replace(' ','_'),safe="_().,'")
    return f"https://en.wikipedia.org/w/index.php?title={t}&oldid={revid}" if revid else f"https://en.wikipedia.org/wiki/{t}"
def rev(title):
    r=R['rev'].get(title) 
    return r
def year_ok_strict(p): return bool(re.search(r'2627|26-27|2026-?27',p or ''))
def year_old(p): return bool(re.search(r'(?<!\d)(?:2[0-5])(?:2[1-6])(?!\d)',p or '')) and not re.search(r'2627',p or '')
OVERRIDE_REJECT={ (4665,'1'):'pattern file belongs to another club (_lyon2627green)',(4665,'2'):'pattern file belongs to another club (_lyon2627onblack)'}
result={}
for tid,t in T.items():
    if tid in EXISTING: continue
    info=(INFO[str(tid)] or {}).get('kits') or {}
    ctitle=INFO[str(tid)]['article']
    sv=SEAS.get(str(tid))
    stitle=sv['title'] if sv else None
    skits=sv['kits'] if sv else []
    slots={}; log={}
    for slot,n,prefix in (('home','1','home'),('away','2','away'),('third','3','third')):
        chosen=None;why=[]
        # season page first
        for k in skits:
            if k['title'].lower().startswith(prefix) and not re.search(r'alt|alternat',k['title'].lower()) and not re.match(r'goal',k['title'].lower()):
                body=hexn(k.get('body'))
                if body and not year_old(k.get('pattern_b')):
                    chosen=dict(src='season',k=k,body=body); break
                else: why.append(f"season-page {prefix} template has no usable body colour or old-season pattern ({k.get('pattern_b')})")
                break
        if not chosen and n in info:
            k=info[n]; body=hexn(k.get('body'))
            if (tid,n) in OVERRIDE_REJECT: why.append(OVERRIDE_REJECT[(tid,n)])
            elif not year_ok_strict(k.get('pattern_b')): why.append(f"infobox pattern '{k.get('pattern_b')}' is not tagged 2026–27")
            elif not body: why.append(f"infobox {prefix} kit is pattern-only (no base colour in the template)")
            else: chosen=dict(src='infobox',k=k,body=body)
        elif not chosen and n not in info: why.append(f"no {prefix} kit in the club infobox")
        slots[slot]=chosen; log[slot]=why
    result[tid]=dict(slots=slots,log=log,ctitle=ctitle,stitle=stitle,skits=skits)
json.dump({k:{'ctitle':v['ctitle'],'stitle':v['stitle'],'log':v['log'],'slots':{s:(None if c is None else dict(src=c['src'],body=c['body'],pattern=c['k'].get('pattern_b'),socks=c['k'].get('socks'),shorts=c['k'].get('shorts'),leftarm=c['k'].get('leftarm'))) for s,c in v['slots'].items()}} for k,v in result.items()},open('resolved.json','w'),indent=1,ensure_ascii=False)
cov=0
for tid,v in result.items():
    s=v['slots']; ok=s['home'] and s['away']
    cov+=bool(ok)
    print(('OK ' if ok else '-- '),T[tid]['league'][:4],tid,T[tid]['name'],{k:(c['body'] if c else None) for k,c in s.items()},'' if ok else {k:x for k,x in v['log'].items() if x})
print(cov,len(result))
