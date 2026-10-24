#!/usr/bin/env python3
"""Генерация PDF для bills-004 и bills-005 через cupsfilter."""
import subprocess

bills = {
    'bills-004': 'Законопроект о поддержке предпринимательства',
    'bills-005': 'Законопроект о государственной охране объектов культурного наследия',
}

for bid, title in bills.items():
    with open(f'/tmp/{bid}.txt', 'w', encoding='utf-8') as f:
        f.write(f'{title}\n')
    subprocess.run(['cupsfilter', f'/tmp/{bid}.txt'],
                   stdout=open(f'public/docs/bills/{bid}.pdf', 'wb'))
    sz = len(open(f'public/docs/bills/{bid}.pdf', 'rb').read())
    print(f'{bid}.pdf: {sz} bytes')
