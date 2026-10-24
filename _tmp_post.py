import json

rows = json.load(open('/Users/arslanondar2003gmail.com/Desktop/khural_site/khural-backend/src/modules/documents/json/postanov_rt.json'))
out = []
out.append('rows=' + str(len(rows)))
nofile = [r for r in rows if not str(r.get('IP_PROP59') or '').strip()]
out.append('no_ip59=' + str(len(nofile)))
for r in nofile[:3]:
    out.append(json.dumps(r, ensure_ascii=False)[:700])
out.append('sample_with=' + json.dumps([r for r in rows if str(r.get('IP_PROP59') or '').strip()][:1], ensure_ascii=False)[:700])
keys = {}
for r in rows:
    for k in r.keys():
        keys[k] = keys.get(k, 0) + 1
out.append('keys=' + str(sorted(keys.items(), key=lambda x: -x[1])[:25]))
open('/tmp/an10.txt', 'w').write('\n'.join(out))
print('done')
