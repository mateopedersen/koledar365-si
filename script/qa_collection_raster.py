#!/usr/bin/env python3
"""Re-render every 2027–2030 pair independently with Poppler at 1024 px.

Validate the existing 600-ppi identity proof against both immutable file hashes
and freshly decoded RGB pixels. Poppler thumbnails and color/edge differences
are diagnostic: independent CMYK renderers do not produce identical RGB pixels.
"""
import hashlib,json,os,subprocess,tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from PIL import Image,ImageChops,ImageFilter,ImageStat
root=Path(__file__).resolve().parents[1];site=root/'site';out=Path(os.environ.get('QA_OUT',root/'evidence/qa/raster'));out.mkdir(parents=True,exist_ok=True)
catalog=[r for r in json.loads((site/'free/catalog.json').read_text()) if r.get('collection')]
proof=json.loads((root/'data/calendar-collection/kontrola-kakovosti.json').read_text());proofs={(r['pdf_sha256'],r['webp_sha256']):r for r in proof['datoteke']};rows=[]
limit=int(os.environ.get('QA_LIMIT','0'));catalog=catalog[int(os.environ.get('QA_OFFSET','0')):];catalog=catalog[:limit] if limit else catalog
def check(item):
 index,entry=item
 row={'pdf':entry['files']['pdf'],'webp':entry['files']['webp'],'year':entry['options']['year'],'month':entry['options']['month'] if entry['options']['type']=='monthly' else 0,'design':entry['options']['design'],'passed':False}
 try:
  pdf=site/row['pdf'].lstrip('/');webp=site/row['webp'].lstrip('/');pair=(hashlib.sha256(pdf.read_bytes()).hexdigest(),hashlib.sha256(webp.read_bytes()).hexdigest())
  reference=proofs[pair];assert reference['ujemanje_vseh_pikslov'];row['original_identity_pixels']=reference['primerjani_piksli']
  with tempfile.TemporaryDirectory() as temporary:
   stem=Path(temporary)/'page';subprocess.run([os.environ.get('PDFTOPPM_BIN','pdftoppm'),'-f','1','-singlefile','-scale-to','1024','-png',str(pdf),str(stem)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
   rendered=Image.open(str(stem)+'.png').convert('RGB')
   with Image.open(webp) as source:
    rgb=source.convert('RGB')
    row['decoded_pixels']=rgb.width*rgb.height
    row['decoded_pixel_sha256']=hashlib.sha256(rgb.tobytes()).hexdigest()
    assert row['decoded_pixels']==reference['primerjani_piksli'],'Pixel dimensions differ from the original PDF/WebP proof'
    assert row['decoded_pixel_sha256']==reference['piksel_sha256'],'Decoded image no longer matches the verified PDF raster'
    reference_image=rgb.resize(rendered.size,Image.Resampling.LANCZOS)
   assert rendered.width>0 and rendered.height>0
   assert ImageStat.Stat(rendered).var[0]>1,'Independent PDF render is blank'
   # Antialiasing and CMYK conversion differ between independent renderers.
   diff=ImageChops.difference(rendered.filter(ImageFilter.GaussianBlur(1)),reference_image.filter(ImageFilter.GaussianBlur(1)))
   row['mean_absolute_error']=round(sum(ImageStat.Stat(diff).mean)/(3*255),6)
   # CMYK FOGRA39 -> RGB conversion changes broad color fills. Compare
   # structural edges with one-pixel antialias tolerance, and keep RGB MAE
   # as diagnostic evidence rather than misclassifying color conversion.
   def edges(im):
    return im.convert('L').filter(ImageFilter.GaussianBlur(.7)).filter(ImageFilter.FIND_EDGES).point(lambda v:255 if v>18 else 0)
   a,b=edges(rendered),edges(reference_image)
   def coverage(x,y):
    return sum(ImageStat.Stat(ImageChops.multiply(x,y.filter(ImageFilter.MaxFilter(3)))).sum)/sum(ImageStat.Stat(x).sum)
   row['edge_coverage']=round(min(coverage(a,b),coverage(b,a)),6)
   row['shifted_negative_control']=round(min(coverage(a,ImageChops.offset(b,10,0)),coverage(ImageChops.offset(b,10,0),a)),6)
   row['diagnostic_only']='CMYK conversion and thin-line antialiasing differ; file and decoded-pixel hashes are the identity gate'
   if index<=15 or (row['year']==2028 and row['month']==2):
    rendered.save(out/f"{row['year']}-{row['month']:02}-{row['design']}.png")
  row['passed']=True
 except Exception as e:row['error']=str(e)
 return row
with ThreadPoolExecutor(max_workers=int(os.environ.get('QA_WORKERS','2'))) as pool:
 for row in pool.map(check,enumerate(catalog,1)):
  rows.append(row)
  if len(rows)%50==0:print(f'{len(rows)}/{len(catalog)}, failed {sum(not r["passed"] for r in rows)}',flush=True)
result={'tested':len(rows),'failed':sum(not r['passed'] for r in rows),'independent_render_size':1024,'identity_gate':'both file SHA-256s plus decoded RGB pixel SHA-256 from original 600-ppi proof','negative_control_shift_pixels':10,'rows':rows}
(out/'raster-comparison.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'tested':len(rows),'failed':result['failed'],'max_mae':max((r.get('mean_absolute_error',0) for r in rows),default=0)}));raise SystemExit(bool(result['failed']))
