#!/usr/bin/env python3
"""Bounded HTTP checks, retaining failures rather than treating bot blocks as broken pages."""
import sys,json,time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,build_opener,HTTPRedirectHandler
from urllib.error import HTTPError
from datetime import datetime,timezone
class Redirects(HTTPRedirectHandler):
    http_error_308=HTTPRedirectHandler.http_error_302
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        self.chain.append({'status':code,'from':req.full_url,'to':newurl})
        return super().redirect_request(req,fp,307 if code==308 else code,msg,headers,newurl)
    def __init__(self): self.chain=[]
def check(row):
    url=row['url'];handler=Redirects();start=time.monotonic()
    try:
        req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; Koledar365LinkAudit/1.0)'})
        with build_opener(handler).open(req,timeout=18) as r:
            # A bounded read verifies the response without downloading entire external PDFs.
            sample=r.read(4096)
            return {**row,'status':r.status,'final_url':r.url,'redirects':handler.chain,'content_type':r.headers.get('Content-Type'),'sample_bytes':len(sample),'magic':sample[:12].hex(),'seconds':round(time.monotonic()-start,3)}
    except HTTPError as e:return {**row,'status':e.code,'final_url':e.url,'redirects':handler.chain,'classification':'access_restricted' if e.code in (401,403,429) else 'http_error'}
    except Exception as e:return {**row,'status':None,'error':str(e),'classification':'unverified_network_error'}
if __name__=='__main__':
    rows=json.loads(Path(sys.argv[1]).read_text())
    with ThreadPoolExecutor(max_workers=5) as pool:results=list(pool.map(check,rows))
    output={'checked_at':datetime.now(timezone.utc).isoformat(),'tested':len(rows),'results':results}
    Path(sys.argv[2]).write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'tested':len(rows),'ok':sum(r.get('status')==200 for r in results),'other':[{k:v for k,v in r.items() if k!='pages'} for r in results if r.get('status')!=200]},ensure_ascii=False))
