import re, urllib.request

def get(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=20).read().decode('utf-8', 'ignore')

for i in [54, 80, 62, 183, 188, 185, 233]:
    html = get(f'https://khural.rtyva.ru/info/corruption/{i}/')
    body = html.split('class="title"', 1)[-1]
    print('=' * 15, i)
    for m in re.finditer(r'<a[^>]*href="([^"]+)"[^>]*>(.*?)</a>', body, re.S):
        href, txt = m.group(1), re.sub(r'<[^>]+>', '', m.group(2))
        txt = re.sub(r'\s+', ' ', txt).strip()
        if 'upload' in href or re.search(r'\.(docx?|pdf|xlsx?|zip|rar)$', href, re.I):
            print(' *', txt[:90], '||', href)
