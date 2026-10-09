import re, sys, html, json, urllib.request

BASE = "https://khural.rtyva.ru"

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

def main(ids):
    out = {}
    for i in ids:
        url = f"{BASE}/info/personnel/{i}/"
        try:
            raw = fetch(url)
        except Exception as e:
            out[i] = {"error": str(e)}
            continue
        m = re.search(r'<main class="row">(.*?)</main>', raw, re.S)
        body = m.group(1) if m else raw
        body = re.split(r'<aside', body)[0]
        body = re.sub(r'<div class="bx-breadcrumb".*?<div style="clear:both"></div></div>', '', body, flags=re.S)
        # h2 title
        t = re.search(r'<h2>(.*?)</h2>', body, re.S)
        title = clean(t.group(1)) if t else ""
        # subpage links
        subs = re.findall(r'href="(/info/personnel/' + re.escape(str(i)) + r'/\d+/?) "', body)
        out[i] = {"title": title, "subs": sorted(set(subs)), "text": clean(body)}
    return out

if __name__ == "__main__":
    ids = sys.argv[1:] or ["2","32","33","159","456","242","285","444","443"]
    data = main(ids)
    with open("/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front/scripts/_tmp_personnel_dump.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print("OK", list(data.keys()))
