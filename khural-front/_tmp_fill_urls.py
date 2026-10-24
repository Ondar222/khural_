#!/usr/bin/env python3
"""Заполняет пустые url в docs_civic.json / docs_bills.json существующими PDF из public/docs/."""
import json
import os

for slug, folder in (("civic", "civic"), ("bills", "bills")):
    path = f"public/data/docs_{slug}.json"
    with open(path, encoding="utf-8") as f:
        docs = json.load(f)
    changed = 0
    for d in docs:
        if not (d.get("url") or "").strip():
            pdf = f"/docs/{folder}/{d['id']}.pdf"
            if os.path.exists(f"public{pdf}") and os.path.getsize(f"public{pdf}") > 0:
                d["url"] = pdf
                changed += 1
            else:
                print(f"  ! нет файла для {d['id']} \u2014 url остаётся пустым")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(docs, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{path}: обновлено {changed} из {len(docs)}")
