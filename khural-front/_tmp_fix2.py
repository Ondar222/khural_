import re, glob, os

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
# Абсолютные ссылки на свой же домен -> относительный путь.
# /api/* не трогаем: там нужен префикс /api, он уже относительный.
pat = re.compile(r'https?://khural\.(?:yurta|rtyva)\.site(?=/)', re.I)

total = 0
for path in glob.glob(root + '/src/**/*.*', recursive=True):
    if not path.endswith(('.js', '.jsx')):
        continue
    try:
        raw = open(path, encoding='utf-8').read()
    except Exception:
        continue
    new, n = pat.subn('', raw)
    if n:
        open(path, 'w', encoding='utf-8').write(new)
        print(f'{n:5}  {os.path.relpath(path, root)}')
        total += n

print('---')
print('заменено:', total)
