import re, glob, os, urllib.parse, urllib.request, json
from concurrent.futures import ThreadPoolExecutor

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
pat = re.compile(r'(?:https?://khural\.(?:rtyva|yurta)\.site)?(/upload/iblock/[^"\'\s<>)]+)', re.I)

paths = set()
def scan(path):
    try:
        raw = open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        return
    for m in pat.findall(raw):
        u = m.strip()
        if u:
            paths.add(urllib.parse.unquote(u))

for p in glob.glob(root + '/public/data/docs_*.json'):
    scan(p)

# 4 файла, не скачавшиеся при импорте в БД
try:
    failed = json.load(open('/Users/arslanondar2003gmail.com/Desktop/khural-backend/import-documents-failed.json'))
    for x in failed:
        u = x.get('url', '')
        if '/upload/' in u:
            paths.add(urllib.parse.unquote(u.split('khural.rtyva.ru', 1)[-1]))
except Exception as e:
    print('failed json:', e)

def head(p):
    url = 'https://khural.rtyva.ru' + urllib.parse.quote(p, safe='/')
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=25) as r:
            return p, r.status, int(r.headers.get('content-length') or 0)
    except Exception as e:
        return p, 'ERR', str(e)[:40]

total = 0
with ThreadPoolExecutor(max_workers=8) as ex:
    for p, status, size in ex.map(head, sorted(paths)):
        if status == 200:
            total += size
            print(f'{status} {size/1024:8.1f} KB  {p}')
        else:
            print(f'{status}            {p}  ({size})')

print('---')
print('файлов:', len(paths), '| суммарно:', round(total/1024/1024, 1), 'MB')
