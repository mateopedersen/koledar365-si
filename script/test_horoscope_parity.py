import copy,json,re,unittest
from pathlib import Path
from horoscope_parity import edition,verify_daily,normalize
class DailyParityTest(unittest.TestCase):
 def test_card_templates_are_complete(self):
  for route in ('horoskop','horoskop/izracun-znamenja'):
   self.assertIn(b'__VERIFIED_DAILY_VALUE__',normalize(Path('site',route,'index.html').read_bytes(),''))
 def test_known_daily_changes_pass_but_static_and_dynamic_tampering_fail(self):
  original=Path('site/horoskop/bik/index.html').read_bytes();day='2026-10-24';e=edition(day);text=original.decode()
  text=re.sub(r'data-edition-day="[^"]*"',f'data-edition-day="{day}"',text)
  fields={'data-edition-status':'Današnja izdaja','data-edition-date':e['display_date'],'data-moon-sign':'Luna v '+e['sky']['moon']['locative'],'data-moon-phase':e['sky']['moon']['phase']+' · '+str(e['sky']['moon']['illumination'])+' % osvetljenosti'}
  for attr,value in fields.items():
   pattern=r'(<([\w-]+)\b[^>]*\b'+attr+r'(?:="[^"]*")?[^>]*>)([^<]*)(</\2>)'
   text=re.sub(pattern,lambda m:re.sub(r'datetime="[^"]*"',f'datetime="{day}"',m[1])+value+m[4],text)
  text=re.sub(r'(<([\w-]+)\b[^>]*data-reading-field="([^"]+)"[^>]*>)([^<]*)(</\2>)',lambda m:m[1]+e['signs']['bik'][m[3]]+m[5],text)
  def schema(m):
   d=json.loads(m[2])
   for item in d.get('@graph',[]):
    if item.get('@type')=='Article' and item.get('@id','').endswith('#dnevni-zapis'):item.update(headline=e['signs']['bik']['title'],datePublished=e['generated_at'],dateModified=e['generated_at'],description='Razvedrilna slovenska izdaja za '+day+'.')
   return m[1]+json.dumps(d)+m[3]
  text=re.sub(r'(<script\b[^>]*type="application/ld\+json"[^>]*>)([\s\S]*?)(</script>)',schema,text)
  self.assertTrue(verify_daily(original,text.encode(),'bik',day))
  for bad in [text.replace('<h1','<h9',1),text.replace(e['signs']['bik']['overview'],'WRONG',1),text.replace('datetime="'+day+'"','datetime="2025-01-01"',1)]:
   with self.assertRaises(AssertionError):verify_daily(original,bad.encode(),'bik',day)
if __name__=='__main__':unittest.main()
