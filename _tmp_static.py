import json
import time
import urllib.request
import urllib.error

files = ['docs_bills', 'docs_civic', 'docs_constitution', 'docs_initiatives', 'docs_laws', 'docs_resolutions']
out = []
for name in files:
    path = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front/public/data/%s.json' % name
    docs = json.load(open(path))
    out.append('==== %s (%d)' % (name, len(docs)))
    for d in docs:
        u = d.get('url') or ''
        status = ''
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0', 'Range': 'bytes=0-64'})
            with urllib.request.urlopen(req, timeout=25) as r:
                ct = str(r.headers.get('Content-Type'))
                head = r.read(64)
                status = str(r.status) + ' ct=' + ct + ' head=' + head[:24].decode('utf-8', 'replace').replace('\n', ' ')
        except urllib.error.HTTPError as e:
            status = 'HTTP ' + str(e.code)
        except Exception as e:
            status = 'ERR ' + str(e)[:60]
        out.append('  ' + str(d.get('id')) + ' | ' + status + ' | ' + u[:110])
        time.sleep(0.4)
open('/tmp/an11.txt', 'w').write('\n'.join(out))
print('done')
