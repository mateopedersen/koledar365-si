"""Lossless atlas packaging keeps the existing Cloudflare Free site below 20k files."""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'public';OUT=PUB/'lunar/atlas';OUT.mkdir(exist_ok=True)
days=json.loads((ROOT/'data/lunar/lunar-daily-2027-2030.json').read_text())['days'];mapping={}
for y in range(2027,2031):
 for m in range(1,13):
  prefix=f'{y}-{m:02}';ds=[d for d in days if d['date'].startswith(prefix)];small=Image.new('RGBA',(7*96,5*96))
  for i,d in enumerate(ds):small.paste(Image.open(ROOT.parent/'moon-masters'/f"{d['date']}-small.webp"),(i%7*96,i//7*96))
  small.save(OUT/f'{prefix}-small.webp',lossless=True,exact=True,method=4)
  for start in range(0,len(ds),7):
   pack=Image.new('RGBA',(3*768,3*768));name=f'{prefix}-{start//7+1}.webp'
   for i,d in enumerate(ds[start:start+7]):
    im=Image.open(ROOT.parent/'moon-masters'/f"{d['date']}.webp");pack.paste(im,(i%3*768,i//3*768));mapping[d['date']]={'path':f'/lunar/atlas/{name}','x':i%3*768,'y':i//3*768,'size':768}
   pack.save(OUT/name,lossless=True,exact=True,method=4)
   check=Image.open(OUT/name)
   for i,d in enumerate(ds[start:start+7]):
    assert check.crop((i%3*768,i//3*768,i%3*768+768,i//3*768+768)).tobytes()==Image.open(ROOT.parent/'moon-masters'/f"{d['date']}.webp").tobytes()
  best=max(ds,key=lambda d:d['illuminationFraction']);Image.open(ROOT.parent/'moon-masters'/f"{best['date']}.webp").save(OUT/f'{prefix}-cover.webp',lossless=True,exact=True)
  print(prefix,flush=True)
(ROOT/'evidence/lunar/atlas-audit.json').write_text(json.dumps({'status':'passed','days':len(mapping),'losslessPixelEquality':True,'files':len(list(OUT.glob('*.webp'))),'largestBytes':max(p.stat().st_size for p in OUT.glob('*.webp'))},indent=2))
