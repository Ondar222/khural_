import json
import time
import urllib.request
import urllib.error
from collections import Counter

items = json.load(open('/tmp/prod_docs.json'))
ids = []
for d in items:
    link = (d.get('pdfFile') or {}).get('link') or ''
    if '/files/' in link:
        ids.append(link.rsplit('/', 1)[-1])

out = []
cnt = Counter()
samples = {}
step = max(1, len(ids) // 40)
picked = ids[::step][:40]
for u in picked:
    url = 'https://khural.yurta.site/api/files/' + u
    ok = False
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-200'})
            with urllib.request.urlopen(req, timeout=30) as r:
                ct = str(r.headers.get('Content-Type'))
                cd = str(r.headers.get('Content-Disposition'))
                head = r.read(200)
                cnt[ct] += 1
                samples.setdefault(ct, (u, cd, head[:40]))
                ok = True
                break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(3 + attempt * 3)
                continue
            cnt['HTTP ' + str(e.code)] += 1
            ok = True
            break
        except Exception as e:
            cnt['ERR ' + str(e)[:40]] += 1
            ok = True
            break
    if not ok:
        cnt['429-gaveup'] += 1
    time.sleep(1.2)
out.append('checked=' + str(len(picked)))
out.append('types=' + str(cnt.most_common()))
for k, v in samples.items():
    out.append('sample ' + k + ' :: ' + str(v))
open('/tmp/an9.txt', 'w').write('\n'.join(out))
print('done')
