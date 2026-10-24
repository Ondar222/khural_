import json, re, glob, os, urllib.parse

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
pat = re.compile(r'(?:https?://khural\.(?:rtyva|yurta)\.site)?(/upload/iblock/[^"\'\s<>)]+)', re.I)

found = {}

def scan_text(path, label):
    try:
        raw = open(path, encoding='utf-8', errors='replace').read()
    except Exception:
        return
    for m in pat.findall(raw):
        u = m.strip()
        if not u:
            continue
        found.setdefault(u, set()).add(label)

# статика разделов документов + фото/контент
for p in glob.glob(root + '/public/data/docs_*.json'):
    scan_text(p, os.path.basename(p))
for p in [root + '/src/content/personnel.js', root + '/src/utils/apparatusContent.js']:
    scan_text(p, os.path.basename(p))

print('уникальных legacy-путей:', len(found))
for u in sorted(found):
    dec = urllib.parse.unquote(u)
    print(' ', dec[:120], '|', ','.join(sorted(found[u])))
