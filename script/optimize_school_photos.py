"""Create web previews only. Preserve the licensed source photographs byte-for-byte."""
import hashlib,json
from pathlib import Path
from PIL import Image,ImageOps
root=Path(__file__).resolve().parent.parent
path=root/'public/school/data.json';data=json.loads(path.read_text());rows=[]
for key,photo in data['photos'].items():
    source=root/'public'/photo['path'].lstrip('/')
    if source.suffix.lower() not in ('.jpg','.jpeg','.png','.webp'):continue
    variants=[]
    with Image.open(source) as original:
        image=ImageOps.exif_transpose(original).convert('RGB')
        for width in sorted({min(320,image.width),min(640,image.width)}):
            height=round(width*image.height/image.width)
            preview=image.resize((width,height),Image.Resampling.LANCZOS)
            temporary=source.parent/'.preview.webp';preview.save(temporary,'WEBP',quality=82,method=6)
            digest=hashlib.sha256(temporary.read_bytes()).hexdigest()[:12]
            dest=source.parent/f'{source.stem}-{width}-{digest}.webp';temporary.replace(dest)
            variants.append({'path':'/'+str(dest.relative_to(root/'public')),'width':width,'height':height,'bytes':dest.stat().st_size})
    photo['display_path']=variants[-1]['path'];photo['srcset']=', '.join(f"{v['path']} {v['width']}w" for v in variants)
    photo['width']=variants[-1]['width'];photo['height']=variants[-1]['height']
    rows.append({'key':key,'source':photo['path'],'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'source_bytes':source.stat().st_size,'variants':variants})
path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
report=root/'reports/seo-2026-10-22/school-image-encoding.json';report.parent.mkdir(parents=True,exist_ok=True);report.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sources':len(rows),'original_bytes':sum(x['source_bytes'] for x in rows),'largest_preview_bytes':sum(x['variants'][-1]['bytes'] for x in rows)}))
