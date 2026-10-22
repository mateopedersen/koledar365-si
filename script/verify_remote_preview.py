#!/usr/bin/env python3
"""Verify a Cloudflare preview against a trusted, locally recorded manifest hash.

Runs on GitHub when the operator's network cannot reach pages.dev. No credentials
are read. The preview host, TLS certificate and content hashes remain verified.
"""
import concurrent.futures,hashlib,json,re,sys,time
from pathlib import Path
from urllib.request import urlopen,Request
from cdn_email_parity import restore_email_html
from horoscope_parity import verify_daily

target=json.loads(Path(sys.argv[1]).read_text())
base=target['url'].rstrip('/')
assert re.fullmatch(r'https://[a-z0-9-]+\.koledar365-si\.pages\.dev',base)
assert re.fullmatch('[a-f0-9]{64}',target['manifest_sha256'])
out=Path('evidence/qa/preview');out.mkdir(parents=True,exist_ok=True)
def fetch(path):
 with urlopen(Request(base+path,headers={'User-Agent':'Koledar365-Preview-Verification/1.0'}),timeout=40) as r:
  return r.status,r.headers,r.read()
status,headers,raw=fetch('/release-manifest.json')
assert status==200 and hashlib.sha256(raw).hexdigest()==target['manifest_sha256'],'Preview manifest differs from the tested local publication'
manifest=json.loads(raw)
assert manifest['source_commit']==target['source_commit']
paths={p for p in manifest['files'] if p.endswith(('.html','.css','.js','.mjs')) or p in ['robots.txt','sitemap.xml','sitemap-pages.xml','llms.txt','release-urls.json']}
def check(p):
 route='/'+p.removesuffix('index.html') if p.endswith('index.html') else '/'+p
 row={'path':p,'url':base+route,'passed':False}
 for attempt in range(3):
  try:
   status,headers,body=fetch(route)
   mime=headers.get('Content-Type','')
   assert status==200,'HTTP '+str(status)
   expected=manifest['files'][p]['sha256'];actual=hashlib.sha256(body).hexdigest()
   row['raw_sha256']=actual
   row['x_robots_tag']=headers.get('X-Robots-Tag','')
   if p.endswith('.html'):assert 'noindex' in row['x_robots_tag'].lower(),'Preview HTML lacks noindex header'
   if actual!=expected and p.endswith('.html'):
    body,counts=restore_email_html(body);actual=hashlib.sha256(body).hexdigest();row['email_transformations']=counts
   if actual!=expected and re.fullmatch(r'horoskop/(?:[^/]+/)?index.html',p) and headers.get('X-Horoscope-Rendering')=='daily-html-v1':
    local=Path('site',p).read_bytes()
    assert hashlib.sha256(local).hexdigest()==expected,'Local fallback differs from preview manifest'
    sign=p.split('/')[1] if p.count('/')==2 and '/izracun-znamenja/' not in p else ''
    verify_daily(local,body,sign,headers.get('X-Horoscope-Date'))
    row['match_type']='verified-daily-edge-render';actual=expected
   assert actual==expected,'Content SHA-256 mismatch'
   if p=='llms.txt':assert 'text/plain' in mime,'Wrong llms.txt MIME'
   row.update(passed=True,status=status,mime=mime,verified_expected_sha256=actual);row.pop('error',None);break
  except Exception as e:
   row['error']=str(e)
   if attempt<2:time.sleep(attempt+1)
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:rows=list(pool.map(check,sorted(paths)))
summary={'target':target,'tested':len(rows),'failed':sum(not r['passed'] for r in rows),'rows':rows}
(out/'remote-parity.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='rows'}));sys.exit(bool(summary['failed']))
