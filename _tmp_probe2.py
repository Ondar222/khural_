import urllib.request
import urllib.error

URLS = [
    'http://localhost:5173/docs/bills/62-zrt-budget-process.pdf',
    'https://khural.yurta.site/docs/bills/62-zrt-budget-process.pdf',
    'https://khural.yurta.site/upload/iblock/62d/constitution.pdf',
    'http://localhost:5173/upload/iblock/62d/constitution.pdf',
    'https://khural.yurta.site/docs/laws/14981/',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
]

out = []
for u in URLS:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read(300)
            out.append(u + ' -> ' + str(r.status) + ' | ct=' + str(r.headers.get('Content-Type')) + ' | cd=' + str(r.headers.get('Content-Disposition')) + ' | len=' + str(len(body)) + ' | ' + body[:100].decode('utf-8', 'replace').replace('\n', ' '))
    except urllib.error.HTTPError as e:
        out.append(u + ' -> HTTP ' + str(e.code) + ' | ct=' + str(e.headers.get('Content-Type')))
    except Exception as e:
        out.append(u + ' -> ERR ' + str(e))
open('/tmp/an8.txt', 'w').write('\n'.join(out))
print('done')
