import re, sys, html, urllib.request, os

BASE = "https://khural.rtyva.ru"
OUT = os.path.dirname(os.path.abspath(__file__))

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="replace")

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

def dump(slug_path, fname):
    raw = fetch(f"{BASE}{slug_path}")
    m = re.search(r'<main class="row">(.*?)</main>', raw, re.S)
    body = m.group(1) if m else raw
    body = re.split(r'<aside', body)[0]
    body = re.sub(r'<div class="bx-breadcrumb".*?<div style="clear:both"></div></div>', '', body, flags=re.S)
    with open(os.path.join(OUT, fname), "w", encoding="utf-8") as f:
        f.write(clean(body))
    print("saved", fname, len(body))

for path, fname in [
    ("/info/personnel/2/755/", "_tmp_s_755.txt"),
    ("/info/personnel/2/14410/", "_tmp_s_14410.txt"),
    ("/info/personnel/2/2035/", "_tmp_s_2035.txt"),
    ("/info/personnel/2/9950/", "_tmp_s_9950.txt"),
    ("/info/personnel/2/6670/", "_tmp_s_6670.txt"),
    ("/info/personnel/32/", "_tmp_s_32.txt"),
    ("/info/personnel/171/", "_tmp_s_171.txt"),
    ("/info/personnel/180/", "_tmp_s_180.txt"),
    ("/info/personnel/179/", "_tmp_s_179.txt"),
    ("/info/personnel/181/", "_tmp_s_181.txt"),
    ("/info/personnel/184/", "_tmp_s_184.txt"),
    ("/info/personnel/1/1/", "_tmp_s_1_1.txt"),
    ("/info/personnel/1/101/", "_tmp_s_1_101.txt"),
    ("/info/personnel/1/102/", "_tmp_s_1_102.txt"),
    ("/info/personnel/158/", "_tmp_s_158.txt"),
    ("/info/personnel/135/", "_tmp_s_135.txt"),
    ("/info/personnel/136/", "_tmp_s_136.txt"),
]:
    try:
        dump(path, fname)
    except Exception as e:
        print("ERR", path, e)
