from wp import *
from club import article
from titles import C
import json, urllib.parse
T={t['team_id']:t for t in json.load(open('teams.json'))}
club={}; season={}
for tid,cs in C.items():
    d,t=article(cs[0]); club[tid]=t
    s=f"2026–27 {cs[0]} season"; sd=raw(s)
    season[tid]=s if sd and not sd.startswith('#REDIRECT') else None
titles=sorted(set(list(club.values())+[s for s in season.values() if s]))
rev={}
for i in range(0,len(titles),40):
    ch=titles[i:i+40]
    u="https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1&prop=revisions&rvprop=ids|timestamp&titles="+urllib.parse.quote('|'.join(ch))
    d=json.loads(get(u))
    for p in d['query']['pages'].values():
        if 'revisions' in p: rev[p['title']]=dict(revid=p['revisions'][0]['revid'],ts=p['revisions'][0]['timestamp'])
json.dump(dict(club=club,season=season,rev=rev),open('revids.json','w'),ensure_ascii=False,indent=1)
print(len(titles),len(rev))
