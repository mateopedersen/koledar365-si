"""Create screen-sized previews; never modify the lossless print atlases."""
from pathlib import Path
import hashlib,json
from PIL import Image
root=Path(__file__).resolve().parents[2];folder=root/'public/lunar/atlas';rows=[]
for source in sorted(folder.glob('*-1.webp')):
 destination=source.with_name(source.name.replace('-1.webp','-screen.webp'))
 with Image.open(source) as image:
  assert image.size==(4608,4608)
  image.resize((2304,2304),Image.Resampling.LANCZOS).save(destination,'WEBP',quality=86,method=5)
 rows.append({'source':source.name,'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'original_bytes':source.stat().st_size,'screen':destination.name,'screen_bytes':destination.stat().st_size})
(root/'evidence/lunar/screen-atlas-audit.json').write_text(json.dumps({'originals_preserved':True,'months':len(rows),'rows':rows},indent=2)+'\n')
print(json.dumps({'months':len(rows),'original_bytes':sum(x['original_bytes'] for x in rows),'screen_bytes':sum(x['screen_bytes'] for x in rows)}))
