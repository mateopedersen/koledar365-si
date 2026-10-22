#!/usr/bin/env python3
"""Compare decompressed live bytes with the exact generated publication.

The site folder must be the deployed publication commit. Redirects are reported;
no cache bypass parameter is added, so this checks normal visitor responses.
"""
import argparse,csv,hashlib,json,mimetypes,time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import Request,build_opener
from urllib.error import HTTPError
from audit_indexability import Redirects,ORIGIN
from cdn_email_parity import restore_email_html
from horoscope_parity import verify_daily
parser=argparse.ArgumentParser();parser.add_argument('--base',default=ORIGIN);parser.add_argument('--downloads',type=Path);parser.add_argument('--out',type=Path,default=Path('evidence/qa/production'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
site=Path('site');manifest=json.loads((site/'release-manifest.json').read_text());inventory=json.loads((site/'release-urls.json').read_text())['pages'];paths={r['path'] for r in inventory}
paths.update('/'+p for p in manifest['files'] if Path(p).suffix in ['.css','.js','.mjs'])
paths.update(['/sitemap.xml','/sitemap-pages.xml','/robots.txt','/llms.txt','/release-manifest.json'])
if (site/'page-revisions.json').exists():paths.add('/page-revisions.json')
if args.downloads:
 with args.downloads.open() as f:paths.update(r['url'] for r in csv.DictReader(f))
def check(route):
 relative=route.lstrip('/')+('index.html' if route.endswith('/') else '')
 local=site/relative;row={'url':args.base+route,'status':0,'mime':'','bytes':0,'expected_sha256':hashlib.sha256(local.read_bytes()).hexdigest() if local.exists() else '', 'live_sha256':'','normalized_sha256':'','match_type':'','cdn_email_transformations':'','cache_control':'','cf_cache_status':'','age':'','passed':False,'issue':''}
 for attempt in range(3):
  try:
   with build_opener(Redirects).open(Request(row['url'],headers={'User-Agent':'Koledar365-Release-Parity/1.0','Accept-Encoding':'identity'}),timeout=60) as response:
    row.update(status=response.status,mime=response.headers.get('Content-Type',''),cache_control=response.headers.get('Cache-Control',''),cf_cache_status=response.headers.get('CF-Cache-Status',''),age=response.headers.get('Age',''))
    h=hashlib.sha256();html_chunks=[]
    while chunk:=response.read(1024*1024):
     h.update(chunk);row['bytes']+=len(chunk)
     if local.suffix=='.html':html_chunks.append(chunk)
    row['live_sha256']=h.hexdigest()
    assert response.url==row['url'],'Unexpected redirect'
    assert row['status']==200,'HTTP status'
    suffix=local.suffix
    mime={'html':'text/html','css':'text/css','pdf':'application/pdf','webp':'image/webp','zip':'application/zip','ics':'text/calendar','txt':'text/plain'}.get(suffix[1:])
    if mime:assert mime in row['mime'],'Wrong MIME type'
    if suffix in ['.js','.mjs']:assert 'javascript' in row['mime'],'Wrong JavaScript MIME'
    if row['expected_sha256']==row['live_sha256']:row['match_type']='exact-bytes'
    elif suffix=='.html':
     restored,counts=restore_email_html(b''.join(html_chunks))
     row['normalized_sha256']=hashlib.sha256(restored).hexdigest();row['cdn_email_transformations']=json.dumps(counts,sort_keys=True)
     if row['normalized_sha256']==row['expected_sha256']:
      row['match_type']='verified-cloudflare-email'
     elif route.startswith('/horoskop/') and response.headers.get('X-Horoscope-Rendering')=='daily-html-v1':
      sign=route.strip('/').split('/')[-1] if route not in ['/horoskop/','/horoskop/izracun-znamenja/'] else ''
      verify_daily(local.read_bytes(),restored,sign,response.headers.get('X-Horoscope-Date'))
      row['match_type']='verified-daily-edge-render'
     else:raise AssertionError('Build and live HTML differ after verified email restoration')
    else:raise AssertionError('Build and live SHA-256 differ')
    row['passed']=True;row['issue']='';break
  except Exception as e:
   row['issue']=str(e)
   if attempt<2:time.sleep(attempt+1);row['bytes']=0
 return row
rows=[]
with ThreadPoolExecutor(max_workers=6) as pool:
 for row in pool.map(check,sorted(paths)):
  rows.append(row)
  if len(rows)%100==0:print(f'{len(rows)}/{len(paths)}, failed {sum(not r["passed"] for r in rows)}',flush=True)
with (args.out/'production-parity.csv').open('w') as f:w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
summary={'base':args.base,'source_commit':manifest.get('source_commit'),'build_at':manifest.get('built_at'),'tested':len(rows),'bytes':sum(r['bytes'] for r in rows),'failed':sum(not r['passed'] for r in rows),'failures':[r for r in rows if not r['passed']]}
(args.out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps({k:v for k,v in summary.items() if k!='failures'}));raise SystemExit(bool(summary['failed']))
