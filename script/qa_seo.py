#!/usr/bin/env python3
"""CSV evidence and fail-closed discovery-file checks, optionally against live HTTP."""
import argparse,csv,json,re,hashlib
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlsplit,urljoin
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET
from audit_indexability import Document,fetch,ORIGIN,NS,image_sitemap_issues
parser=argparse.ArgumentParser();parser.add_argument('--live',action='store_true');parser.add_argument('--out',type=Path,default=Path('evidence/qa/seo'));args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
site=Path('site');issues=[]
revisions=json.loads((site/'page-revisions.json').read_text()) if (site/'page-revisions.json').exists() else {}
def get(name):
 if not args.live:return (site/name).read_text()
 result=fetch(ORIGIN+'/'+name)
 assert result.get('status')==200,(name,result.get('status'),result.get('error'))
 if name=='llms.txt':assert 'text/plain' in {k.lower():v for k,v in result['headers'].items()}.get('content-type',''),'llms MIME must be text/plain'
 return result['body']
index=ET.fromstring(get('sitemap.xml'));assert index.tag=='{'+NS['s']+'}sitemapindex'
urls=[];lastmods={};image_xml=None;image_lastmods={}
children=[loc.text for loc in index.findall('s:sitemap/s:loc',NS)]
expected=[ORIGIN+'/sitemap-pages.xml']+([ORIGIN+'/sitemap-images.xml'] if (site/'sitemap-images.xml').exists() else [])
assert children==expected,'Unexpected or repeated sitemap child'
for loc in index.findall('s:sitemap/s:loc',NS):
 assert loc.text.startswith(ORIGIN+'/')
 text=get(urlsplit(loc.text).path.lstrip('/'));tree=ET.fromstring(text);assert tree.tag=='{'+NS['s']+'}urlset'
 nodes=tree.findall('s:url',NS);assert len(nodes)<=50000 and len(text.encode())<=50*1024*1024
 child_urls=[node.findtext('s:loc',namespaces=NS) for node in nodes]
 assert len(child_urls)==len(set(child_urls)),'Repeated URL within sitemap'
 if loc.text.endswith('/sitemap-images.xml'):
  image_xml=text
  image_lastmods={node.findtext('s:loc',namespaces=NS):node.findtext('s:lastmod',default='',namespaces=NS) for node in nodes}
  continue
 for node in nodes:
  url=node.findtext('s:loc',namespaces=NS);urls.append(url);lastmods[url]=node.findtext('s:lastmod',default='',namespaces=NS)
assert len(urls)==len(set(urls)),'Repeated sitemap URL'
robots=RobotFileParser();robots.parse(get('robots.txt').splitlines());assert ORIGIN+'/sitemap.xml' in robots.site_maps()
if image_xml is not None:
 assert not image_sitemap_issues(image_xml,urls,site,robots),'Invalid image discovery sitemap'
 assert all(lastmods[url]==value for url,value in image_lastmods.items()),'Conflicting page revision dates in image sitemap'
local={}
for f in site.rglob('*.html'):
 d=Document(f.read_text());route='/'+str(f.relative_to(site)).removesuffix('index.html')
 if not d.noindex:local[ORIGIN+route]=d
assert set(local)==set(urls),'Generated HTML and sitemap inventories differ'
responses={}
if args.live:
 with ThreadPoolExecutor(max_workers=6) as pool:
  for r in pool.map(fetch,urls):responses[r['url']]=r
rows=[];canonical_rows=[]
for url in urls:
 r=responses.get(url);d=Document(r.get('body','')) if r else local[url];errors=[]
 headers={k.lower():v for k,v in r.get('headers',{}).items()} if r else {}
 status=r.get('status',0) if r else 200;final=r.get('final_url','') if r else url
 for condition,error in [(status==200,'HTTP status'),(final==url,'redirect'),(d.canonicals==[url],'canonical'),(not d.noindex and 'noindex' not in headers.get('x-robots-tag',''),'noindex'),(robots.can_fetch('Googlebot',url),'robots blocked'),(bool(d.title and d.headings and len(d.content)>80),'missing content / soft 404'),(url.endswith('/'),'trailing slash')]:
  if not condition:errors.append(error)
 if args.live and (d.title!=local[url].title or d.headings!=local[url].headings):errors.append('source/build/live title or H1 mismatch')
 if headers.get('link') and 'canonical' in headers['link'] and url not in headers['link']:errors.append('HTTP canonical disagrees')
 expected_lastmod=revisions.get(urlsplit(url).path,{}).get('modified_at','')
 if lastmods[url]!=expected_lastmod:errors.append('lastmod differs from verified page revision history')
 row={'url':url,'page_type':urlsplit(url).path.split('/')[1] or 'home','status':status,'redirect':final!=url,'indexable':not d.noindex,'robots_allowed':robots.can_fetch('Googlebot',url),'canonical':'|'.join(d.canonicals),'canonical_target_status':status if d.canonicals==[url] else 'unverified','lastmod':lastmods[url] or 'omitted: no significant-change history','passed':not errors,'issues':'; '.join(errors)}
 rows.append(row);canonical_rows.append({k:row[k] for k in ['url','status','canonical','canonical_target_status','passed','issues']})
 issues.extend(url+': '+e for e in errors)
for name,data in [('sitemap-audit.csv',rows),('canonical-audit.csv',canonical_rows)]:
 with (args.out/name).open('w') as f:w=csv.DictWriter(f,fieldnames=list(data[0]));w.writeheader();w.writerows(data)
guide=get('llms.txt');assert len(re.findall(r'^# ',guide,re.M))==1 and guide.startswith('# Koledar365.si\n')
assert not re.search(r'<(?:html|!doctype)',guide,re.I)
links=re.findall(r'^- \[[^\]]+\]\((https://[^)]+)\): (.+)$',guide,re.M)
assert len(links)==len(set(u for u,d in links)) and 10<len(links)<len(urls)
assert all(u in urls and description.strip() for u,description in links)
sections=re.findall(r'^## (.+)$',guide,re.M)
(args.out/'live-urls.txt').write_text('\n'.join(sorted(urls))+'\n')
(args.out/'llms-txt-validation.md').write_text('# LLMS doğrulaması\n\n'+f"Ortam: {'canlı HTTP' if args.live else 'yerel build'}. {len(links)} benzersiz canonical bağlantı, {len(sections)} Slovence bölüm. Tek H1, UTF-8 metin, açıklamalı Markdown bağlantıları; tüm hedefler sitemap ve indexable HTML ile eşleşiyor.\n\n"+'\n'.join('- '+s for s in sections)+'\n\nGoogle sıralama sinyali veya sitemap alternatifi olarak sunulmaz.\n')
summary={'mode':'live' if args.live else 'build','sitemap_urls':len(urls),'indexable_html':len(local),'llms_links':len(links),'llms_sections':len(sections),'failed':len(issues),'issues':issues}
(args.out/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary));raise SystemExit(bool(issues))
