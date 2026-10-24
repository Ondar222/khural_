import re, glob, os

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
pat = re.compile(r'https?://khural\.(?:yurta|rtyva)\.site[^\s"\'<>)`]*', re.I)

rows = []
for path in glob.glob(root + '/src/**/*.*', recursive=True):
    if not path.endswith(('.js', '.jsx', '.json', '.css', '.html')):
        continue
    try:
        raw = open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        continue
    hits = pat.findall(raw)
    if hits:
        rows.append((os.path.relpath(path, root), len(hits), sorted(set(h[:70] for h in hits))[:3]))

rows.sort(key=lambda r: -r[1])
for name, n, sample in rows:
    print(f'{n:5}  {name}')
    for s in sample:
        print('         ', s)
print('---')
print('файлов:', len(rows), '| всего ссылок:', sum(r[1] for r in rows))
