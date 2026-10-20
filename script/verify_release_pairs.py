"""Independent second-pass verification against a newly rasterized source PDF."""
import os,json,time,hashlib,tempfile,subprocess,zipfile
from pathlib import Path
from PIL import Image,ImageChops,ImageCms
from pypdf import PdfReader
ROOT=Path(__file__).resolve().parent.parent
SHARD=int(os.environ.get('VERIFY_SHARD','0'));SHARDS=int(os.environ.get('VERIFY_SHARDS','1'))
BIN=os.environ.get('PDFTOPPM_BIN','pdftoppm')
OUT=ROOT/f"evidence/{os.environ.get('VERIFY_PREFIX','release-verification')}-{SHARD}.json"
PATTERN=os.environ.get('CATALOG_PATTERN','release-catalog-[0-9].json')
records={}
if OUT.exists():
 for row in json.loads(OUT.read_text()).get('results',[]):
  if row.get('passed'):records[row['fingerprint']]=row

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def verify(row):
 folder=ROOT/'storage/release-catalog'/row['fingerprint'];meta=json.loads((folder/'manifest.json').read_text())
 pdf=folder/row['files']['pdf'];reader=PdfReader(pdf)
 assert digest(pdf)==meta['pdf_sha256'],'PDF hash mismatch'
 assert len(reader.pages)==meta['page_count']==len(meta['pages']),'Page count mismatch'
 checks=[]
 for index,(page,record) in enumerate(zip(reader.pages,meta['pages']),1):
  webp=folder/record['filename'];assert digest(webp)==record['sha256'],'WebP hash mismatch'
  text=page.extract_text();assert 'Koledar365' in text and 'koledar365.si' in text,'Missing brand'
  font_objects=page['/Resources'].get('/Font',{}).get_object()
  for font in font_objects.values():
   font=font.get_object();descriptor=font.get('/FontDescriptor')
   if descriptor:assert any(key in descriptor.get_object() for key in ['/FontFile','/FontFile2','/FontFile3']),'Font not embedded'
  with Image.open(webp) as encoded:
   assert encoded.format=='WEBP','Wrong format'
   assert encoded.size==(record['width_px'],record['height_px']),'Wrong dimensions'
   assert 'sRGB' in ImageCms.getProfileDescription(ImageCms.ImageCmsProfile(__import__('io').BytesIO(encoded.info['icc_profile']))),'No sRGB profile'
   pixels=encoded.convert('RGB')
  ppi_x=pixels.width/(float(page.mediabox.width)/72);ppi_y=pixels.height/(float(page.mediabox.height)/72)
  assert min(ppi_x,ppi_y)>=600,'Effective raster below 600 ppi'
  if meta['identity_fields']['color_mode']=='monochrome_bw':
   r,g,b=pixels.split();assert not ImageChops.difference(r,g).getbbox() and not ImageChops.difference(r,b).getbbox(),'Chromatic BW pixels'
  with tempfile.TemporaryDirectory(prefix='k365-raster-check-') as temporary:
   prefix=Path(temporary)/'source'
   subprocess.run([BIN,'-f',str(index),'-l',str(index),'-singlefile','-scale-to-x',str(pixels.width),'-scale-to-y',str(pixels.height),'-png',str(pdf),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,timeout=60)
   with Image.open(prefix.with_suffix('.png')) as original:
    difference=ImageChops.difference(pixels,original.convert('RGB'))
    assert not difference.getbbox(),'WebP differs from independently rasterized PDF'
  border=round(5*600/25.4)
  corners=[(0,0,border,border),(pixels.width-border,0,pixels.width,border),(0,pixels.height-border,border,pixels.height),(pixels.width-border,pixels.height-border,pixels.width,pixels.height)]
  white=Image.new('RGB',(border,border),'white')
  assert all(not ImageChops.difference(pixels.crop(box),white).getbbox() for box in corners),'Ink in 5mm page corner'
  checks.append({'page':index,'width':pixels.width,'height':pixels.height,'ppi_x':round(ppi_x,3),'ppi_y':round(ppi_y,3),'pixel_difference_bbox':None,'corners_clear_mm':5})
  pixels.close()
 if meta['page_count']>1:
  with zipfile.ZipFile(folder/row['files']['webp']) as archive:
   assert set(archive.namelist())=={p['filename'] for p in meta['pages']}|{'README.txt','manifest.json'},'ZIP page membership mismatch'
   for p in meta['pages']:assert hashlib.sha256(archive.read(p['filename'])).hexdigest()==p['sha256'],'ZIP page differs'
 return {'fingerprint':row['fingerprint'],'options':row['options'],'passed':True,'pdf_sha256':meta['pdf_sha256'],'pages':checks,'checks':['actual PDF fonts and brand','actual lossless WebP and sRGB','true physical 600 ppi','fresh PDF raster pixel equality','four 5mm corners','ZIP page byte equality']}

while True:
 reports=[]
 try:
  reports=[json.loads(path.read_text()) for path in sorted((ROOT/'evidence').glob(PATTERN))]
 except (json.JSONDecodeError,OSError):time.sleep(2);continue
 rows=[row for report in reports for row in report['results'] if row.get('status')=='passed']
 targets=[row for row in rows if int(row['fingerprint'][:8],16)%SHARDS==SHARD and row['fingerprint'] not in records]
 for row in targets:
  try:record=verify(row)
  except Exception as error:record={'fingerprint':row['fingerprint'],'options':row['options'],'passed':False,'error':str(error)}
  records[row['fingerprint']]=record
  result={'verified_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'shard':SHARD,'completed':len(records),'passed':all(r['passed'] for r in records.values()),'results':list(records.values())}
  temporary=OUT.with_suffix('.tmp');temporary.write_text(json.dumps(result,ensure_ascii=False,indent=2));temporary.replace(OUT)
  print(f"{SHARD}: {len(records)} {row['options']['type']} {row['options']['year']}-{row['options']['month']} {row['options']['design']} {'passed' if record['passed'] else record.get('error')}",flush=True)
 done=len(reports)==2 and all(r['completed']==r['expected'] for r in reports)
 if done and not targets:break
 time.sleep(3)
raise SystemExit(0 if records and all(row['passed'] for row in records.values()) else 1)
