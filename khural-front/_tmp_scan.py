import json, os, re, glob

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
pat_rtyva = re.compile(r'khural\.rtyva\.ru', re.I)
pat_upload = re.compile(r'/upload/iblock', re.I)
pat_yurta = re.compile(r'khural\.yurta\.site', re.I)

for path in sorted(glob.glob(root + '/public/**/*.json', recursive=True)):
    try:
        raw = open(path, encoding='utf-8').read()
    except Exception:
        continue
    r = len(pat_rtyva.findall(raw))
    u = len(pat_upload.findall(raw))
    y = len(pat_yurta.findall(raw))
    if r or u or y:
        print(f'{os.path.relpath(path, root)}: rtyva={r} upload={u} yurta={y}')
