"""Record the model review and independently check every expanded day / PDF string."""
import json,re,hashlib,datetime,collections,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];EV=ROOT/'evidence/lunar'
p=argparse.ArgumentParser();p.add_argument('--pass-number',type=int,choices=[1,2],required=True);a=p.parse_args()
items=json.loads((EV/'text-inventory.json').read_text())['items'];assets=json.loads((ROOT/'data/lunar/assets.json').read_text())['assets'];days=json.loads((ROOT/'data/lunar/lunar-daily-2027-2030.json').read_text())['days'];events=json.loads((ROOT/'data/lunar/lunar-events-2027-2030.json').read_text())['events']
for x in assets:
 for key in ['variantLabelSl','previewAltSl']:items.append({'id':x['assetId']+'-'+key,'context':'print download card','text':x[key]})
 text=(ROOT.parent/'lunar-proofs'/(x['assetId']+'.txt')).read_text();items.append({'id':x['assetId']+'-pdf','context':'PDF extracted fixed text runs','text':text})
 rows=[d for d in days if d['date'].startswith(f"{x['year']}-{x['month']:02}-")] if x['month'] else []
 if a.pass_number==1 and rows:
  expected=collections.Counter(f"{d['illuminationFraction']*100:.1f}".replace('.',',')+' %' for d in rows)
  assert collections.Counter(re.findall(r'\d+,\d %',text))==expected,x['assetId']
 if a.pass_number==2 and (x['month'] or x['variantId'] in ['Y03','Y04']):
  ee=[e for e in events if e['localDate'].startswith(f"{x['year']}-"+(f"{x['month']:02}-" if x['month'] else ''))]
  normalized=' '.join(text.split())
  for e in ee:
   d=datetime.date.fromisoformat(e['localDate']);needle=f"{d.day}. {d.month}. {e['localTime'].replace(':','.')} UTC{e['localDateTime'][-6:]}";assert needle in normalized,(x['assetId'],needle)
for item in items:
 text=item['text'];assert '\ufffd' not in text and '\x00' not in text
 assert not re.search(r'\d\.\d\s*%',text)
 assert not re.search(r'ob \d+\.\d+\.? uri',text)
 assert not re.search(r'\d+,\d dni',text)
 assert not any(w in text for w in ['Prenesi PNG','Fullmoonology','kalendorius365'])
 item['sha256']=hashlib.sha256(text.encode()).hexdigest();item['review']='passed';item.pop('text',None)
record={'status':'passed','pass':a.pass_number,'reviewer':'Codex','humanNativeSlovenianReviewer':False,'basis':'Contextual model review of all template categories, metadata, ALT prose, controls and method text; expanded dates and print instances checked individually by rules. This is not a human editorial certification.','checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'items':items,'knownUnresolvedFindings':[],'sources':['https://svetovalnica.zrc-sazu.si/topic/155/sklon-meseca-za-vrstilnim-%C5%A1tevnikom-pri-zapisovanju-datumov','https://svetovalnica.zrc-sazu.si/topic/26/pisanje-znaka-za-odstotek','https://svetovalnica.zrc-sazu.si/topic/1490/zapis-nepolne-oz-necele-ure'],'corrections':['Monthly H1 uses za + month, instead of a dash-only title','Monthly descriptions use actual full-Moon date and local time','Genitive dates, decimal comma and nonbreaking web percentage spaces','PDF percentages are indivisible fixed-position text runs']}
(EV/f'language-pass-{a.pass_number}.json').write_text(json.dumps(record,ensure_ascii=False,indent=2));print({'pass':a.pass_number,'items':len(items),'status':'passed'})
