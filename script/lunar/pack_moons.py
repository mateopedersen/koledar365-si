"""Lossless atlas packaging keeps the existing Cloudflare Free site below 20k files."""
from pathlib import Path
from PIL import Image
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'public';OUT=PUB/'lunar/atlas';OUT.mkdir(exist_ok=True)
days=json.loads((ROOT/'data/lunar/lunar-daily-2027-2030.json').read_text())['days'];mapping={};keep=set()
for y in range(2027,2031):
 for m in range(1,13):
  prefix=f'{y}-{m:02}';ds=[d for d in days if d['date'].startswith(prefix)];small=Image.new('RGBA',(7*96,5*96))
  for i,d in enumerate(ds):small.paste(Image.open(ROOT.parent/'moon-masters'/f"{d['date']}-small.webp"),(i%7*96,i//7*96))
  small_name=f'{prefix}-small.webp';small.save(OUT/small_name,lossless=True,exact=True,method=4);keep.add(small_name)
  pack=Image.new('RGBA',(6*768,6*768));name=f'{prefix}-1.webp'
  for i,d in enumerate(ds):
   im=Image.open(ROOT.parent/'moon-masters'/f"{d['date']}.webp");pack.paste(im,(i%6*768,i//6*768));mapping[d['date']]={'path':f'/lunar/atlas/{name}','x':i%6*768,'y':i//6*768,'size':768}
  pack.save(OUT/name,lossless=True,exact=True,method=4);keep.add(name)
  check=Image.open(OUT/name)
  for i,d in enumerate(ds):
   assert check.crop((i%6*768,i//6*768,i%6*768+768,i//6*768+768)).tobytes()==Image.open(ROOT.parent/'moon-masters'/f"{d['date']}.webp").tobytes()
  best=max(ds,key=lambda d:d['illuminationFraction']);Image.open(ROOT.parent/'moon-masters'/f"{best['date']}.webp").save(OUT/f'{prefix}-cover.webp',lossless=True,exact=True)
  keep.add(f'{prefix}-cover.webp')
  print(prefix,flush=True)
for old in OUT.glob('*.webp'):
 if old.name not in keep:old.unlink()
(ROOT/'evidence/lunar/atlas-audit.json').write_text(json.dumps({'status':'passed','days':len(mapping),'losslessPixelEquality':True,'files':len(list(OUT.glob('*.webp'))),'largestBytes':max(p.stat().st_size for p in OUT.glob('*.webp'))},indent=2))

# Screen previews are derived separately; lossless source atlases stay untouched.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/"script/lunar/screen_atlases.py")],check=True)
