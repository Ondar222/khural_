import re, sys, html

def clean(seg):
    seg = re.sub(r'<a\b[^>]*href="([^"]*)"[^>]*>(.*?)</a>',
                 lambda m: f'[LINK:{m.group(1)}]{re.sub(r"<[^>]+>","",m.group(2)).strip()}[/LINK]',
                 seg, flags=re.S)
    seg = re.sub(r'<img\b[^>]*src="([^"]*)"[^>]*>', lambda m: f'[IMG:{m.group(1)}]', seg)
    seg = re.sub(r'<br\s*/?>', '\n', seg)
    seg = re.sub(r'</(p|div|h\d|li|tr|table)>', '\n', seg)
    seg = re.sub(r'<[^>]+>', '', seg)
    seg = html.unescape(seg)
    seg = re.sub(r'[ \t]+', ' ', seg)
    seg = re.sub(r'\n\s*\n\s*\n+', '\n\n', seg)
    return seg.strip()

for path in sys.argv[1:]:
    raw = open(path, encoding='utf-8', errors='replace').read()
    m = re.search(r'<main class="row">(.*?)</main>', raw, re.S)
    body = m.group(1) if m else raw
    body = re.split(r'<aside', body)[0]
    body = re.sub(r'<div class="bx-breadcrumb".*?<div style="clear:both"></div></div>', '', body, flags=re.S)
    print("########", path)
    print(clean(body))
    print()