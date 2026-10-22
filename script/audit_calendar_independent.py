#!/usr/bin/env python3
"""Independently check exported 2027–2030 dates using Python's Gregorian/ISO calendar.
Does not import CalendarEngine or its holiday dataset. Statutory days are the
GOV.SI list; Easter fixtures are independently checked against USNO date tables.
"""
import calendar,datetime as dt,json,re,sys
from pathlib import Path
from html import unescape
from zoneinfo import ZoneInfo
root=Path(__file__).resolve().parents[1];site=root/'site'
months='januar februar marec april maj junij julij avgust september oktober november december'.split()
easters={2027:'2027-03-28',2028:'2028-04-16',2029:'2029-04-01',2030:'2030-04-21'}
fixed=[(1,1),(1,2),(2,8),(4,27),(5,1),(5,2),(6,25),(8,15),(10,31),(11,1),(12,25),(12,26)]
rows=[];zone=ZoneInfo('Europe/Ljubljana')
def text(s):return unescape(re.sub('<[^>]*>','',s))
for year in range(2027,2031):
 easter=dt.date.fromisoformat(easters[year]);free={dt.date(year,m,d) for m,d in fixed}|{easter,easter+dt.timedelta(days=1),easter+dt.timedelta(days=49)}
 annual=0
 for month,name in enumerate(months,1):
  route=f'/koledar/{year}/{name}/';html=(site/route.lstrip('/')/'index.html').read_text();errors=[]
  table=re.search(r'<table class="calendar".*?</table>',html,re.S).group();trs=re.findall(r'<tr>(.*?)</tr>',table,re.S)[1:]
  expected=calendar.Calendar(0).monthdatescalendar(year,month)
  if len(trs)!=len(expected):errors.append('week row count')
  all_dates=[]
  for tr,week in zip(trs,expected):
   number=re.search(r'<th[^>]*class="weeknum"[^>]*>(\d+)</th>',tr)
   if not number or int(number[1])!=week[0].isocalendar().week:errors.append('ISO week number')
   cells=re.findall(r'<td\b([^>]*)>(.*?)</td>',tr,re.S)
   if len(cells)!=7:errors.append('seven weekdays')
   for (attrs,body),date in zip(cells,week):
    iso=date.isoformat();actual=re.search(r'data-date="([^"]+)"',attrs)
    if not actual or actual[1]!=iso:errors.append('date position '+iso)
    if date.month==month:
     all_dates.append(iso)
     if f'datetime="{iso}"' not in body:errors.append('semantic date '+iso)
     classes=re.search(r'class="([^"]*)"',attrs)[1].split()
     if ('holiday' in classes)!=(date in free):errors.append('statutory work-free flag '+iso)
     if ('weekend' in classes)!=(date.weekday()>4):errors.append('weekend flag '+iso)
  days=calendar.monthrange(year,month)[1];working=sum(dt.date(year,month,d).weekday()<5 and dt.date(year,month,d) not in free for d in range(1,days+1));annual+=working
  if len(all_dates)!=days or len(set(all_dates))!=days:errors.append('missing or repeated dates')
  facts=re.search(r'<section class="panel prose calendar-facts".*?</section>',html,re.S).group()
  if f'<strong>{working} delovnih dni</strong>' not in facts:errors.append('workday fact')
  if f'{working*8} ur' not in facts:errors.append('working hours')
  h1=text(re.search(r'<h1\b[^>]*>(.*?)</h1>',html,re.S)[1]).casefold()
  if name not in h1 or str(year) not in h1:errors.append('wrong H1 period')
  if f'/lunin-koledar/{year}/{name}/' not in html:errors.append('context lunar link')
  rows.append(dict(path=route,days=days,working_days=working,hours=working*8,weeks=len(expected),first_week=list(expected[0][0].isocalendar()),last_week=list(expected[-1][0].isocalendar()),passed=not errors,issues=errors))
 annual_html=(site/f'delovni-dnevi/{year}/index.html').read_text()
 assert f'data-year-days>{annual}</strong>' in annual_html,(year,annual)
for year in range(2027,2031):
 for month,before,after in [(3,1,2),(10,2,1)]:
  last=calendar.monthrange(year,month)[1];day=last-(dt.date(year,month,last).weekday()+1)%7;instant=dt.datetime(year,month,day,1,tzinfo=dt.timezone.utc)
  assert (instant-dt.timedelta(seconds=1)).astimezone(zone).utcoffset().total_seconds()==before*3600
  assert instant.astimezone(zone).utcoffset().total_seconds()==after*3600
out=Path(sys.argv[1] if len(sys.argv)>1 else root/'evidence/final-calendar-validation.json');out.parent.mkdir(parents=True,exist_ok=True)
report=dict(checked_at=dt.datetime.now(dt.timezone.utc).isoformat(),months=len(rows),days=sum(r['days'] for r in rows),timezone='Europe/Ljubljana',dst_boundaries=8,failed=sum(not r['passed'] for r in rows),rows=rows)
out.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print({k:v for k,v in report.items() if k!='rows'});sys.exit(bool(report['failed']))
