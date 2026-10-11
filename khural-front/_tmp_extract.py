# -*- coding: utf-8 -*-
"""Извлечение контента подстраниц /info/personnel/* из скачанного HTML."""
import re, os, json

SRC = os.path.join(os.path.dirname(__file__), "_tmp_pers")
OUT = os.path.join(os.path.dirname(__file__), "_tmp_pers_content.json")

IDS = ["2", "32", "33", "159", "171", "456"]

def article_of(raw):
    m = re.search(r"<article[^>]*>(.*?)</article>", raw, re.S)
    return m.group(1) if m else ""

def title_of(art):
    m = re.search(r"<h2[^>]*>(.*?)</h2>", art, re.S)
    return re.sub(r"<[^>]+>", "", m.group(1)).strip() if m else ""

def body_of(art):
    body = re.sub(r"<h2[^>]*>.*?</h2>", "", art, count=1, flags=re.S)
    body = re.split(r"<aside", body)[0]
    body = re.sub(r"<table[^>]*>\s*(?:<tbody>\s*</tbody>\s*)?</table>", "", body, flags=re.S)
    return body.strip()

def file_links(body):
    """Ссылки на файлы/bitrix-загрузки."""
    out = []
    for m in re.finditer(r'href="([^"]+)"', body):
        h = m.group(1)
        if re.search(r"\.(pdf|docx?|xlsx?|rtf|zip|rar|odt|xls)\b", h, re.I) or "/upload/" in h or "/storedir/" in h:
            out.append(h)
    return out

res = {}
all_links = []
for pid in IDS:
    p = os.path.join(SRC, pid + ".html")
    if not os.path.exists(p):
        continue
    raw = open(p, encoding="utf-8", errors="replace").read()
    art = article_of(raw)
    body = body_of(art)
    res[pid] = {"title": title_of(art), "html": body}
    all_links += file_links(body)

json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

# Вывод только ASCII-безопасно (терминал портит кириллицу)
print("pages:", [(k, len(v["html"])) for k, v in res.items()])
print("FILE LINKS:")
seen = set()
for h in all_links:
    if h in seen:
        continue
    seen.add(h)
    print("  ", h.encode("unicode_escape").decode()[:160])