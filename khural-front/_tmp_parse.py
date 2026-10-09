import re, html, sys

path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/personnel.html'
s = open(path, encoding='utf-8', errors='replace').read()

def clean(t):
    t = re.sub(r'<[^>]+>', ' ', t)
    return html.unescape(re.sub(r'\s+', ' ', t)).strip()

links = re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', s, re.S)
seen = set()
print('=== LINKS ===')
for href, txt in links:
    t = clean(txt)
    if not t:
        continue
    key = (href, t)
    if key in seen:
        continue
    seen.add(key)
    low = (href + ' ' + t).lower()
    if any(k in low for k in ['personnel', 'конкурс', 'комисси', 'ваканси', 'кадр', 'обращен', 'должност']):
        print(href, '|', t)

print()
print('=== HEADINGS ===')
for m in re.finditer(r'<(h[1-4])[^>]*>(.*?)</\1>', s, re.S | re.I):
    print(m.group(1), '|', clean(m.group(2)))

print()
print('=== TEXT BLOCKS ===')
for m in re.finditer(r'<(?:p|li)[^>]*>(.*?)</(?:p|li)>', s, re.S):
    t = clean(m.group(1))
    if len(t) > 25:
        print('-', t[:400])
