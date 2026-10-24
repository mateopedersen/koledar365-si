#!/usr/bin/env python3
"""Check every published image's HTTP eligibility, without downloading image bodies.

A pass proves crawl eligibility at audit time, never search-engine index inclusion.
"""
import argparse, csv, json, re, time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener
from urllib.robotparser import RobotFileParser
from audit_indexability import ORIGIN, Redirects, fetch

EXTENSIONS = {'.jpg','.jpeg','.png','.webp','.avif','.svg','.gif','.bmp'}

def check(path, origin, robots):
    url = origin + '/' + path
    row = {'path':path,'status':0,'mime':'','x_robots_tag':'','robots_allowed':all(robots.can_fetch(agent,url) for agent in ('Googlebot-Image','bingbot')),'redirect':False,'passed':False,'issue':''}
    for attempt in range(3):
        try:
            with build_opener(Redirects).open(Request(url, method='HEAD', headers={'User-Agent':'Koledar365-Image-Eligibility-Audit/1.0'}), timeout=45) as response:
                row.update(status=response.status,mime=response.headers.get('Content-Type',''),x_robots_tag=', '.join(response.headers.get_all('X-Robots-Tag',[])),redirect=response.url!=url)
                errors=[]
                if response.status!=200:errors.append('HTTP status')
                if not row['mime'].startswith('image/'):errors.append('not image MIME')
                if re.search(r'\b(noindex|none)\b',row['x_robots_tag'],re.I):errors.append('X-Robots-Tag blocks indexing')
                if not row['robots_allowed']:errors.append('robots.txt blocks crawler')
                if row['redirect']:errors.append('image redirects')
                row.update(passed=not errors,issue='; '.join(errors))
                return row
        except (HTTPError,URLError,TimeoutError,OSError) as error:
            row.update(status=getattr(error,'code',0),issue=str(error))
            if getattr(error,'code',0) not in (429,500,502,503,504,0):break
            if attempt<2:time.sleep(2*(attempt+1))
    return row

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--site',type=Path,default=Path('site'))
    parser.add_argument('--origin',default=ORIGIN)
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    manifest=json.loads((args.site/'release-manifest.json').read_text())
    paths=sorted(path for path in manifest['files'] if Path(path).suffix.lower() in EXTENSIONS)
    result=fetch(args.origin+'/robots.txt')
    if result.get('status')!=200:raise SystemExit('Cannot verify live robots.txt')
    robots=RobotFileParser();robots.parse(result['body'].splitlines())
    rows=[]
    with ThreadPoolExecutor(max_workers=6) as pool:
        for i,row in enumerate(pool.map(lambda p:check(p,args.origin,robots),paths),1):
            rows.append(row)
            if i%500==0:print(json.dumps({'checked':i,'failed':sum(not r['passed'] for r in rows)}),flush=True)
    with (args.out/'images.csv').open('w') as file:
        writer=csv.DictWriter(file,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    summary={'checked_at':datetime.now(timezone.utc).isoformat(),'origin':args.origin,'images_checked':len(rows),'failed':sum(not r['passed'] for r in rows),'blocked_by_header':sum('blocks indexing' in r['issue'] for r in rows),'robots_blocked':sum(not r['robots_allowed'] for r in rows),'non_200':sum(r['status']!=200 for r in rows),'passed':all(r['passed'] for r in rows),'scope':'All published image assets; eligibility only, not indexed-image count'}
    (args.out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary),flush=True)
    return 0 if summary['passed'] else 1

if __name__=='__main__':raise SystemExit(main())
