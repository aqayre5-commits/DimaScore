import re, json
from wp import *
from titles import C
T={t['team_id']:t for t in json.load(open('teams.json'))}
def article(title, lang='en', depth=0):
    d=raw(title,lang)
    if d is None: return None,title
    m=re.match(r'\s*#(?:REDIRECT|redirect|Redirect|تحويل|REDIRECTION)\s*\[\[([^\]|#]+)',d)
    if m and depth<3: return article(m.group(1).strip(),lang,depth+1)
    return d,title
def infobox_kits(d):
    kits={}
    for n in ('1','2','3','4'):
        k={}
        for f in ('pattern_la','pattern_b','pattern_ra','pattern_sh','pattern_so','leftarm','body','rightarm','shorts','socks'):
            m=re.search(r'(?m)^\s*\|\s*'+f+n+r'\s*=\s*([^\n|}]*)',d)
            if m: k[f]=m.group(1).strip().replace('<!--','').strip()
        if k: kits[n]=k
    return kits
if __name__=='__main__':
    out={}
    for tid,cs in C.items():
        base=cs[0]
        cand=[base]+[x for x in [ {'Inter Milan':'Inter Milan'}.get(base)] if x]
        d,t=article(base)
        out[tid]=dict(article=t,kits=infobox_kits(d) if d else None)
        ks=out[tid]['kits']
        print(T[tid]['league'][:4],tid,T[tid]['name'],'|',t,'|',{n:(k.get('pattern_b','')[:22],k.get('body','')) for n,k in (ks or {}).items()})
    json.dump(out,open('club_infobox_kits.json','w'),ensure_ascii=False,indent=1)
