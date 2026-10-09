import re, os, json, html as H

SRC = "/tmp/pers"
OUT = os.path.join(os.path.dirname(__file__), "_tmp_personnel_content.json")

def article_of(raw):
    m = re.search(r"<article[^>]*>(.*?)</article>", raw, re.S)
    return m.group(1) if m else None

def tidy(block):
    # обрезаем aside/side-menu если попал
    block = re.split(r"<aside", block)[0]
    # убрать пустые таблицы-заглушки
    block = re.sub(r"<table[^>]*>\s*<tbody>\s*</tbody>\s*</table>", "", block, flags=re.S)
    block = re.sub(r"<table[^>]*>\s*</table>", "", block, flags=re.S)
    # нормализуем относительные ссылки/картинки на полные
    block = re.sub(r'href="/', 'href="https://khural.rtyva.ru/', block)
    block = re.sub(r'src="/', 'src="https://khural.rtyva.ru/', block)
    return block.strip()

def title_of(block):
    m = re.search(r"<h2[^>]*>(.*?)</h2>", block, re.S)
    return H.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip() if m else ""

res = {}
for fn in sorted(os.listdir(SRC)):
    if not fn.endswith(".html"):
        continue
    pid = fn[:-5]
    raw = open(os.path.join(SRC, fn), encoding="utf-8", errors="replace").read()
    art = article_of(raw)
    if not art:
        res[pid] = {"title": "", "html": "", "error": "no article"}
        continue
    art = tidy(art)
    # убираем сам h2 (заголовок отдаём отдельно)
    body = re.sub(r"<h2[^>]*>.*?</h2>", "", art, count=1, flags=re.S).strip()
    res[pid] = {"title": title_of(art), "html": body}

json.dump(res, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for pid in sorted(res, key=lambda x: int(x) if x.isdigit() else 0):
    t = res[pid]["title"]
    n = len(res[pid]["html"])
    links = len(re.findall(r"<a ", res[pid]["html"]))
    print("%-5s len=%-6d links=%-3d %s" % (pid, n, links, t[:70]))
