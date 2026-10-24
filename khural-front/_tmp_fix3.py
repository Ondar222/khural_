import re, pathlib

root = pathlib.Path('/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front')

# 1. DOC_BASE в отчётах комитетов -> пусто
for name in ['src/data/committeeReportsConv3.js', 'src/data/committeeReportsConv4.js']:
    p = root / name
    raw = p.read_text(encoding='utf-8')
    new = raw.replace('const DOC_BASE = "https://khural.yurta.site";', 'const DOC_BASE = "";')
    if new != raw:
        p.write_text(new, encoding='utf-8')
        print('DOC_BASE -> "":', name)

# 2. apparatusContent: фото rtyva -> относительные /upload/...
p = root / 'src/utils/apparatusContent.js'
raw = p.read_text(encoding='utf-8')
new, n = re.subn(r'https://khural\.rtyva\.ru(?=/upload/)', '', raw)
p.write_text(new, encoding='utf-8')
print('apparatusContent: заменено', n)

# 3. DataContext: база фото -> относительные пути
p = root / 'src/context/DataContext.jsx'
raw = p.read_text(encoding='utf-8')
new = raw.replace(
    'const KHURAL_UPLOAD_BASE = "https://khural.rtyva.ru";',
    '// Пустая база намеренно: ссылки остаются относительными (/upload/...), их отдаёт\n'
    '// тот же nginx, что и сайт (локально — vite-прокси на старый сайт).\n'
    'const KHURAL_UPLOAD_BASE = "";',
)
assert new != raw, 'DataContext: не нашёл KHURAL_UPLOAD_BASE'
p.write_text(new, encoding='utf-8')
print('DataContext: KHURAL_UPLOAD_BASE -> ""')

# 4. onError-хендлеры фото: вместо /img-proxy — срез домена (same-origin)
files = [
    'src/components/PersonDetail.jsx',
    'src/pages/CommitteeStaffDetail.jsx',
    'src/pages/Government.jsx',
    'src/pages/Deputies.jsx',
    'src/pages/Committee.jsx',
    'src/pages/Section.jsx',
    'src/pages/DeputiesV2.jsx',
]
old_cond = 'currentSrc.includes("khural.rtyva.ru")'
new_cond = '/^https?:\\/\\/khural\\.(?:yurta|rtyva)\\.site/i.test(currentSrc)'
old_rep = '.replace("https://khural.rtyva.ru", "/img-proxy")'
new_rep = '.replace(/^https?:\\/\\/khural\\.(?:yurta|rtyva)\\.site/i, "")'
for name in files:
    p = root / name
    raw = p.read_text(encoding='utf-8')
    c1 = raw.count(old_cond)
    c2 = raw.count(old_rep)
    new = raw.replace(old_cond, new_cond).replace(old_rep, new_rep)
    # вариант с const proxyUrl = currentSrc.replace(...)
    new = new.replace(
        'const proxyUrl = currentSrc.replace(/^https?:\\/\\/khural\\.(?:yurta|rtyva)\\.site/i, "");',
        'const proxyUrl = currentSrc.replace(/^https?:\\/\\/khural\\.(?:yurta|rtyva)\\.site/i, "");',
    )
    if new != raw:
        p.write_text(new, encoding='utf-8')
        print(f'{name}: условий {c1}, замен домена {c2}')
