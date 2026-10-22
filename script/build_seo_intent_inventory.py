"""Describe actual page intent and evidence, without inventing search volumes."""
import csv,json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
folder=root/'reports/seo-2026-10-22/current'
r=json.loads((folder/'full-audit.json').read_text())
graph=json.loads((folder/'internal-links.json').read_text())['edges']
intents={
 'koledar':'Pregled datumov, praznikov in prenos koledarja za izbrano obdobje',
 'lunin-koledar':'Dnevni prikazi Lune, časi men in prenos luninega koledarja',
 'delovni-dnevi':'Informativni fond delovnih dni in ur po navedenih predpostavkah',
 'prazniki':'Pravni status, datum in dan v tednu praznika',
 'pomembni-dnevi':'Pomen obeležitve in preverljiv koledarski datum',
 'soncni-vzhod-in-zahod':'Izračun lokalnih sončnih časov za izbrani kraj in datum',
 'horoskop':'Razvedrilno branje ali geometrijski izračun znamenja',
 'solske-pocitnice':'Uradno objavljeni šolski termini in regionalne razlike',
 'matura':'Roki mature po predmetu in vrsti izpita',
 'npz':'Datumi preverjanj in objave dosežkov po razredu',
 'studijski-koledar':'Primerjava objavljenih študijskih obdobij izbranih ustanov',
 'izplacila-pokojnin':'Objavljeni datum izplačila po uradnem koledarju ZPIZ',
 'izplacila-socialnih-transferjev':'Objavljeni termini izbranih prejemkov CSD',
 'setveni-koledar':'Sezonski okviri opravil in osebni načrt vrta',
 'podaljsani-vikendi':'Primerjava skupnega oddiha in porabe dopusta',
}
with (folder/'search-intent.csv').open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['url','primary_user_intent','primary_sl_topic','supporting_terms_from_visible_headings','distinct_period_or_subject','title','description','h1','heading_outline','related_canonical_destinations','schema_types','review_limit'])
 for p in r['pages']:
  if not p['indexable']:continue
  title=p['title'].removesuffix(' · Koledar365')
  w.writerow([p['url'],intents.get(p['family'],'Uporaba prikazanega orodja ali razumevanje navedene vsebine'),title,' | '.join(h['text'] for h in p['headings'] if h['level'] in [2,3])[:2000],p['path'],p['title'],p['description'],' | '.join(p['h1']),' | '.join(f"H{h['level']}: {h['text']}" for h in p['headings'])[:4000],' | '.join(graph.get(p['path'],[])),' | '.join(str(n['type']) for n in p['schemas']),'Actual inventory mapping; no measured search volume or native-speaker certification'])
print('Wrote public URL intent inventory')
