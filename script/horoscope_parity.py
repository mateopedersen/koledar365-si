"""Verify only the documented daily edge transformation; preserve all static bytes."""
import functools,html,json,re,subprocess
@functools.lru_cache(maxsize=3)
def edition(day):
 code="import {currentEdition} from './lib/horoscope/current.mjs'; const d=process.argv[1];console.log(JSON.stringify({...currentEdition(d),display_date:new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Ljubljana'}).format(new Date(d+'T12:00:00Z'))}));"
 return json.loads(subprocess.check_output(['node','--input-type=module','-e',code,day],text=True))
def normalize(body,sign,expected=None):
 text=body.decode('utf-8')
 def value(actual,wanted,label):
  if expected is not None:assert html.unescape(actual)==str(wanted),f'Unexpected daily {label}'
  return '__VERIFIED_DAILY_VALUE__'
 text=re.sub(r'data-edition-day="([^"]*)"',lambda m:'data-edition-day="'+value(m[1],expected and expected['local_date'],'day')+'"',text)
 fields={'data-edition-status':expected and 'Današnja izdaja','data-edition-date':expected and expected['display_date'],'data-moon-sign':expected and 'Luna v '+expected['sky']['moon']['locative'],'data-moon-phase':expected and expected['sky']['moon']['phase']+' · '+str(expected['sky']['moon']['illumination'])+' % osvetljenosti'}
 for attr,wanted in fields.items():
  pattern=r'(<([\w-]+)\b[^>]*\b'+attr+r'(?:="[^"]*")?[^>]*>)([^<]*)(</\2>)'
  def replace(m):
   start=m[1]
   if attr=='data-edition-date':start=re.sub(r'datetime="([^"]*)"',lambda d:'datetime="'+value(d[1],expected and expected['local_date'],'datetime')+'"',start)
   return start+value(m[3],wanted,attr)+m[4]
  text,n=re.subn(pattern,replace,text);assert n==1,f'Missing or duplicated {attr}'
 def reading(m):
  field=m[3];wanted=expected and expected['signs'][sign][field]
  return m[1]+value(m[4],wanted,field)+m[5]
 text,count=re.subn(r'(<([\w-]+)\b[^>]*data-reading-field="([^"]+)"[^>]*>)([^<]*)(</\2>)',reading,text)
 assert count==6,'Reading field count changed'
 def schema(m):
  data=json.loads(m[2])
  for item in data.get('@graph',[]):
   if item.get('@type')=='Article' and item.get('@id','').endswith('#dnevni-zapis'):
    for k,v in {'headline':expected and expected['signs'][sign]['title'],'datePublished':expected and expected['generated_at'],'dateModified':expected and expected['generated_at'],'description':expected and 'Razvedrilna slovenska izdaja za '+expected['local_date']+'.'}.items():item[k]=value(item.get(k),v,k)
  return m[1]+json.dumps(data,ensure_ascii=False,sort_keys=True,separators=(',',':'))+m[3]
 text=re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)([\s\S]*?)(</script>)',schema,text)
 return text.encode()
def verify_daily(local,live,sign,day):
 assert re.fullmatch(r'\d{4}-\d{2}-\d{2}',day or ''),'Missing daily edge date'
 expected=edition(day)
 assert normalize(local,sign)==normalize(live,sign,expected),'Static template differs outside verified daily fields'
 return True
