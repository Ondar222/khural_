import urllib.request
import urllib.error

URLS = [
    'http://localhost:5173/api/files/00000000-0000-0000-0000-000000000000',
    'http://localhost:5173/files/00000000-0000-0000-0000-000000000000',
    'http://localhost:3004/api/files/00000000-0000-0000-0000-000000000000',
    'https://khural.yurta.site/api/files/00000000-0000-0000-0000-000000000000',
    'http://localhost:5173/upload/iblock/zz/nonexistent.pdf',
    'http://localhost:5173/documents/999999',
]

out = []
for u in URLS:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read(200)
            out.append(u + ' -> ' + str(r.status) + ' | ct=' + str(r.headers.get('Content-Type')) + ' | cd=' + str(r.headers.get('Content-Disposition')) + ' | ' + body[:120].decode('utf-8', 'replace').replace('\n', ' '))
    except urllib.error.HTTPError as e:
        body = e.read(200)
        out.append(u + ' -> HTTP ' + str(e.code) + ' | ct=' + str(e.headers.get('Content-Type')) + ' | ' + body[:120].decode('utf-8', 'replace').replace('\n', ' '))
    except Exception as e:
        out.append(u + ' -> ERR ' + str(e))
open('/tmp/an7.txt', 'w').write('\n'.join(out))
print('done')
