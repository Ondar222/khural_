import pathlib

p = pathlib.Path('/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front/src/content/personnel.js')
raw = p.read_text(encoding='utf-8')
n = raw.count('https://khural.yurta.site/upload/')
raw = raw.replace('https://khural.yurta.site/upload/', '/upload/')
p.write_text(raw, encoding='utf-8')
print('personnel.js: заменено', n)
