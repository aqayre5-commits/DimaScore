import urllib.request, urllib.parse, json, time, os, re, sys
UA="RevampStudio/1.0 (kits research; contact via abdilahi) python"
CACHE=os.path.join(os.path.dirname(os.path.abspath(__file__)),'cache'); os.makedirs(CACHE,exist_ok=True)
def get(url, key=None):
    import hashlib; key=key or re.sub(r'[^A-Za-z0-9]+','_',url)[:60]+hashlib.md5(url.encode()).hexdigest()
    p=os.path.join(CACHE,key)
    if os.path.exists(p): return open(p,encoding='utf8').read()
    for i in range(3):
        try:
            r=urllib.request.Request(url,headers={'User-Agent':UA})
            d=urllib.request.urlopen(r,timeout=40).read().decode('utf8','replace')
            open(p,'w',encoding='utf8').write(d); time.sleep(0.15); return d
        except Exception as e:
            err=str(e); time.sleep(1)
    return None
def raw(title, lang='en'):
    u=f"https://{lang}.wikipedia.org/w/index.php?title={urllib.parse.quote(title.replace(' ','_'))}&action=raw"
    return get(u)
def search(q, lang='en', n=5):
    u=f"https://{lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&srlimit={n}&srsearch={urllib.parse.quote(q)}"
    d=get(u)
    return [x['title'] for x in json.loads(d)['query']['search']] if d else []
