import re, glob, os, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
pat = re.compile(r'[\'"(]/docs/([^\'")\s<>]+?)[\'")]', re.I)

paths = set()
for path in glob.glob(root + '/src/**/*.*', recursive=True):
    if not path.endswith(('.js', '.jsx')):
        continue
    raw = open(path, encoding='utf-8', errors='replace').read()
    for m in pat.findall(raw):
        paths.add(urllib.parse.unquote(m))

# публичные файлы, которые уже лежат в dist
local = set()
for dirpath, dirnames, filenames in os.walk(root + '/public/docs'):
    for f in filenames:
        local.add(os.path.relpath(os.path.join(dirpath, f), root + '/public/docs'))

print('ссылок /docs/ уникальных:', len(paths))
def head(p):
    if os.path.exists(root + '/public/docs/' + p):
        return p, 'LOCAL', os.path.getsize(root + '/public/docs/' + p)
    url = 'https://khural.rtyva.ru/docs/' + urllib.parse.quote(p)
    try:
        req = urllib.request.Request(url, method='HEAD')
        with urllib.request.urlopen(req, timeout=25) as r:
            return p, r.status, int(r.headers.get('content-length') or 0)
    except Exception as e:
        return p, 'ERR', str(e)[:40]

total = 0
for p, status, size in sorted(ThreadPoolExecutor(8).map(head, sorted(paths))):
    if status in (200, 'LOCAL'):
        total += size
    print(f'{str(status):>6} {size/1024 if isinstance(size,int) else 0:9.1f} KB  {p}')
print('---')
print('суммарно:', round(total/1024/1024, 1), 'MB')
