import os, urllib.request, urllib.parse

BASE = "https://khural.rtyva.ru"
DEST = "/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-front/public/docs/personnel"
os.makedirs(DEST, exist_ok=True)

files = [
    # Методика, комиссии
    ("/upload/iblock/398/Методика проведения конкурса.pdf", "metodika-konkursa.pdf"),
    ("/upload/iblock/97f/s7mcx7xxx0vixa6didbho4r2e4apd3x4/распоряжение.docx", "rasporyazhenie-o-komissii.docx"),
    ("/upload/iblock/023/d5be353cnh69xbxpwh0whksuagfpo7ww/состав комиссии.docx", "sostav-komissii.docx"),
    # Приложения для участия в конкурсе
    ("/docs/приложение 1.doc", "prilozhenie-1-zayavlenie.doc"),
    ("/docs/форма Анкеты (870).docx", "forma-ankety-870.docx"),
    ("/docs/приложение 3.doc", "prilozhenie-3-medzaklyuchenie.doc"),
    ("/docs/Приложение 4.RTF", "prilozhenie-4-svedeniya-o-saitah.rtf"),
    ("/docs/Приложение 5.doc", "prilozhenie-5-soglasie-na-obrabotku.doc"),
    # Протоколы и объявления конкурсов
    ("/upload/iblock/1a2/Протокол.pdf", "protokol-1-ot-03-02-2020.pdf"),
    ("/upload/iblock/395/Протокол 2.pdf", "protokol-2-ot-17-02-2020.pdf"),
    ("/upload/iblock/081/ОБЪЯВЛЕНИЕ на сайт итоги 2 этапа.doc", "itogi-2-etapa-04-12-2020.doc"),
    ("/upload/iblock/832/на сайт итоги 1 этапа 10.11.2020.doc", "itogi-1-etapa-10-11-2020.doc"),
    ("/upload/iblock/144/815lt5k8103unv813fzr9cclj5nxqpc6/на сайт итоги 1 этапа.doc", "itogi-26-10-2022.doc"),
    ("/upload/iblock/84c/ei33u52o6tlislg804h6knatwjqbbdm0/ОБЪЯВЛЕНИЕ на сайт итоги.doc", "itogi-17-11-2022.doc"),
    ("/upload/iblock/da8/ojul4js33gq710v1q7nagb1mm6b6sbgx/1 этап на сайт.pdf", "obyavlenie-29-04-2025.pdf"),
    ("/upload/iblock/01f/i475ee14s79ad7zdshy1cl1lgkfe5yon/ОБЪЯВЛЕНИЕ на сайт итоги май 2025г.doc", "itogi-13-05-2025.doc"),
]

for src, name in files:
    url = BASE + urllib.parse.quote(src)
    out = os.path.join(DEST, name)
    if os.path.exists(out) and os.path.getsize(out) > 0:
        print("skip", name)
        continue
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        if r.status == 200 and len(data) > 0:
            with open(out, "wb") as f:
                f.write(data)
            print("ok", name, len(data))
        else:
            print("FAIL", name, r.status)
    except Exception as e:
        print("ERR", name, e)
