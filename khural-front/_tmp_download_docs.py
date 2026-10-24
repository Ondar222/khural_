import os, re, glob, json, urllib.parse, urllib.request, shutil

root = '/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front'
dst_root = os.path.join(root, 'public', 'docs')

# читаем исходники в БЫТАХ, чтобы не испортить кодировку имён
pat = re.compile(rb'[\'"`]/docs/([^\'"`\s<>]+?)[\'"`]')
skip = (b'laws', b'bills', b'civic', b'constitution', b'initiatives',
        b'personnel', b'resolutions', b'env', b':')
names = set()
for p in glob.glob(root + '/src/**/*.js*', recursive=True):
    for m in pat.findall(open(p, 'rb').read()):
        if m.startswith(skip):
            continue
        names.add(urllib.parse.unquote_to_bytes(m))  # percent-decoded bytes

print('имён:', len(names))

def magic_ok(b):
    return b[:4] in (b'%PDF', b'PK\x03\x04') or b[:5] == b'<?xml' or b[:15].startswith(b'GIF8') or \
           b[:3] == b'\xff\xd8\xff' or b[:4] == b'RIFF' or b[:4] == b'\x00\x00\x01\x00' or \
           b[:4] == b'II\x2a\x00' or b[:4] == b'MM\x00\x2a' or b[:4] == b'CWS\x03' or \
           b[:4] == b'\xd7\xab\x93\xea'  # jfif/jpeg exif variants handled by ffd8

report = []
for nb in sorted(names):
    name = nb.decode('utf-8')
    dst = os.path.join(dst_root, name)
    if os.path.exists(dst):
        head = open(dst, 'rb').read(16)
        if magic_ok(head) or head[:5] == b'\xff\xd8\xff\xe0' or head[:2] == b'\xff\xd8':
            report.append(('skip', name, os.path.getsize(dst)))
            continue
        os.remove(dst)
    url = 'https://khural.rtyva.ru/docs/' + urllib.parse.quote(nb)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=300) as r:
            data = r.read()
        if not magic_ok(data[:16]) and data[:2] != b'\xff\xd8':
            report.append(('BAD_HTML', name, len(data)))
            continue
        with open(dst, 'wb') as f:
            f.write(data)
        report.append(('OK', name, len(data)))
    except Exception as e:
        report.append(('ERR', name, str(e)[:60]))

for st, n, s in report:
    print(st, s, n)