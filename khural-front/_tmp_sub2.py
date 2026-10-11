# -*- coding: utf-8 -*-
"""Скачивание вложенных подстраниц (через index.php) + извлечение текста/ссылок."""
import urllib.request, urllib.parse, time, re, html as H, json, os

BASE = "https://khural.rtyva.ru"
OUTDIR = os.path.join(os.path.dirname(__file__), "_tmp_pers2")
os.makedirs(OUTDIR, exist_ok=True)

# (parent, id)
SUBS = [
    ("2", "755"), ("2", "14410"), ("2", "2035"), ("2", "9950"), ("2", "6670"),
    ("32", "108"), ("32", "857"), ("32", "869"), ("32", "885"), ("32", "1757"),
    ("32", "1821"), ("32", "2299"), ("32", "2201"), ("32", "2641"), ("32", "2768"),
    ("32", "4364"), ("32", "4430"), ("32", "5877"),
    ("33", "879"),
]
hdr = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"}

def article_of(raw):
    m = re.search(r"<article[^>]*>(.*?)</article>", raw, re.S)
    return m.group(1) if m else ""

def clean_body(art):
    b = re.sub(r"<h2[^>]*>.*?</h2>", "", art, count=1, flags=re.S)
    b = re.split(r"<aside", b)[0]
    b = re.sub(r"<link[^>]*>", "", b)
    b = re.sub(r'<div class="bx-breadcrumb">.*?<div style="clear:both"></div></div>', "", b, flags=re.S)
    return b

def text_only(body):
    t = re.sub(r"<br\s*/?>", "\n", body)
    t = re.sub(r"</(p|li|tr|div|h[1-6])>", "\n", t)
    t = H.unescape(re.sub(r"<[^>]+>", "", t))
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n", t)
    return t.strip()

out = {}
log = []
for parent, sid in SUBS:
    url = "%s/info/personnel/%s/%s/index.php" % (BASE, parent, sid)
    key = "%s-%s" % (parent, sid)
    try:
        raw = urllib.request.urlopen(urllib.request.Request(url, headers=hdr), timeout=25).read().decode("utf-8", "replace")
        open(os.path.join(OUTDIR, key + ".html"), "w", encoding="utf-8").write(raw)
        art = article_of(raw)
        body = clean_body(art)
        m = re.search(r"<h2[^>]*>(.*?)</h2>", art, re.S)
        title = H.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else ""
        links = [{"href": mm.group(1), "text": H.unescape(re.sub(r"<[^>]+>", "", mm.group(2))).strip()}
                 for mm in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', body, re.S)]
        out[key] = {"title": title, "text": text_only(body), "links": links}
        log.append("OK %s len=%s title_len=%s links=%s" % (key, len(raw), len(title), len(links)))
    except Exception as e:
        log.append("ERR %s %r" % (key, e))
    time.sleep(0.35)

json.dump(out, open(os.path.join(os.path.dirname(__file__), "_tmp_sub2.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
with open(os.path.join(os.path.dirname(__file__), "_tmp_sub2.txt"), "w", encoding="utf-8") as f:
    f.write("\n".join(log) + "\n\n")
    for k in out:
        f.write("=" * 70 + "\n%s  TITLE=%s\n" % (k, out[k]["title"]))
        f.write("-" * 70 + "\n" + out[k]["text"] + "\n")
        for l in out[k]["links"]:
            f.write("  [%s] %s\n" % (l["href"], l["text"]))
        f.write("\n")
print("done")