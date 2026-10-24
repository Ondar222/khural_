#!/usr/bin/env python3
"""Check encoding of docs JSON files."""
import json
import glob

for fpath in sorted(glob.glob('public/data/docs_*.json')):
    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    if data:
        title = data[0]['title']
        has_cyrillic = any('\u0400' <= c <= '\u04FF' for c in title)
        print(f"{fpath}: has_cyrillic={has_cyrillic}")
        print(f"  Title repr: {repr(title[:60])}")
