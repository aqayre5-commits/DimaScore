import re, json
from wp import *
from titles import C
T={t['team_id']:t for t in json.load(open('teams.json'))}
def blocks(txt):
    out=[];i=0
    while True:
        j=txt.lower().find('{{football kit',i)
        if j<0: break
        depth=0;k=j
        while k<len(txt):
            if txt.startswith('{{',k): depth+=1;k+=2
            elif txt.startswith('}}',k):
                depth-=1;k+=2
                if depth==0: break
            else: k+=1
        out.append((j,txt[j:k])); i=k
    return out
def params(b):
    d={}
    # top-level params only
    body=b[2:-2]
    parts=[];depth=0;cur=''
    i=0
    while i<len(body):
        if body.startswith('{{',i) or body.startswith('[[',i): depth+=1;cur+=body[i:i+2];i+=2;continue
        if body.startswith('}}',i) or body.startswith(']]',i): depth-=1;cur+=body[i:i+2];i+=2;continue
        if body[i]=='|' and depth==0: parts.append(cur);cur=''
        else: cur+=body[i]
        i+=1
    parts.append(cur)
    for p in parts[1:]:
        if '=' in p:
            k,v=p.split('=',1); d[k.strip()]=v.strip()
    return d
def kits(txt):
    res=[]
    for pos,b in blocks(txt):
        p=params(b)
        # find preceding heading/caption
        before=txt[:pos]
        cap=re.findall(r"\|\+\s*(?:\{\{nowrap\|)?'*([^'\n}|]+)",before)
        h=re.findall(r'^=+\s*([^=\n]+?)\s*=+\s*$',before,re.M)
        res.append(dict(title=re.sub(r'<[^>]+>|\{\{0\}\}|\s+',' ',p.get('title','')).strip(),caption=(cap[-1].strip() if cap else ''),heading=(h[-1] if h else ''),**{k:v for k,v in p.items() if k!='title'}))
    return res
if __name__=='__main__':
    allk={}
    for tid,cs in C.items():
        for c in cs:
            t=f"2026–27 {c} season"; d=raw(t)
            if d and not d.startswith('#REDIRECT'):
                allk[tid]=dict(title=t,kits=kits(d)); break
    json.dump(allk,open('wp_kits_raw.json','w'),ensure_ascii=False,indent=1)
    for tid,v in allk.items():
        print(T[tid]['league'][:4],tid,T[tid]['name'],v['title'],len(v['kits']),[ (k['caption'][:8],k['title'][:14]) for k in v['kits']][:12])
    print(len(allk))
