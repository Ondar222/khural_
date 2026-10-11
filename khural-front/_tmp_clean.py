# -*- coding: utf-8 -*-
"""Чистка извлечённого HTML: убрать bitrix-мусор, оставить список ссылок и текст."""
import re, os, json, html as H

SRC = os.path.join(os.path.dirname(__file__), "_tmp_pers")
OUT = os.path.join(os.path.dirname(__file__), "_tmp_pers_clean.json")
IDS = ["2", "32", "33", "159", "171", "456"]

def article_of(raw):
    m = re.search(r"<article[^>]*>(.*?)</article>", raw, re.S)
    return m.group(1) if m else ""

def clean_body(art):
    b = re.sub(r"<h2[^>]*>.*?</h2>", "", art, count=1, flags=re.S)
    b = re.split(r"<aside", b)[0]
    b = re.sub(r"<link[^>]*>", "", b)
    b = re.sub(r'<div class="bx-breadcrumb">.*?<div style="clear:both"></div></div>', "", b, flags=re.S)
    b = re.sub(r"<table[^>]*>\s*(?:<tbody>\s*</tbody>\s*)?</table>", "", b, flags=re.S)
    # схлопнуть пустые td/tr без ссылок
    b = re.sub(r"[ \t]+", " ", b)
    b = re.sub(r"\n\s*\n+", "\n", b)
    return b.strip()

def text_only(body):
    t = re.sub(r"<br\s*/?>", "\n", body)
    t = re.sub(r"</(p|li|tr|div)>", "\n", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = H.unescape(t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n", t)
    return t.strip()

out = {}
for pid in IDS:
    p = os.path.join(SRC, pid + ".html")
    if not os.path.exists(p):
        continue
    raw = open(p, encoding="utf-8", errors="replace").read()
    art = article_of(raw)
    body = clean_body(art)
    m = re.search(r"<h2[^>]*>(.*?)</h2>", art, re.S)
    title = H.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else ""
    # все ссылки (текст + href)
    links = []
    for mm in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', body, re.S):
        txt = H.unescape(re.sub(r"<[^>]+>", "", mm.group(2))).strip()
        links.append({"href": mm.group(1), "text": txt})
    out[pid] = {"title": title, "body": body, "links": links, "text": text_only(body)}

json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# выводим в файл чтобы не портить кириллицу в терминале
with open(os.path.join(os.path.dirname(__file__), "_tmp_pers_text.txt"), "w", encoding="utf-8") as f:
    for pid in IDS:
        if pid not in out:
            continue
        f.write("=" * 70 + "\n")
        f.write("ID=%s TITLE=%s\n" % (pid, out[pid]["title"]))
        f.write("-" * 70 + "\n")
        f.write(out[pid]["text"] + "\n")
        f.write("LINKS:\n")
        for l in out[pid]["links"]:
            f.write("  [%s] %s\n" % (l["href"], l["text"]))
        f.write("\n")
print("done, pages:", list(out.keys()))
