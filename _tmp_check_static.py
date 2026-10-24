import json

bills = json.load(open('/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front/public/data/docs_bills.json'))
print(f'docs_bills.json: {len(bills)} items — {sum(1 for d in bills if d.get("url"))} have urls')
for d in bills:
    print(f'  {d["id"]}: {d.get("url","(none)")} → {d["title"][:70]}')

civic = json.load(open('/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front/public/data/docs_civic.json'))
print(f'docs_civic.json: {len(civic)} items — {sum(1 for d in civic if d.get("url"))} have urls')
for d in civic:
    print(f'  {d["id"]}: {d.get("url","(none)")} → {d["title"][:70]}')

# Check which are actually broken (serve HTML instead of files)
import urllib.request
for name, items in [('bills', bills), ('civic', civic)]:
    broken = []
    for d in items:
        url = d.get('url','')
        if not url:
            continue
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=20) as r:
                ct = r.headers.get('Content-Type','')
                head = r.read(200)
                if 'text/html' in ct or head[:50].lower().startswith(b'<!doctype'):
                    broken.append(d)
        except Exception as e:
            broken.append(d)
    print(f'\n{name}: {len(broken)}/{len(items)} broken')
