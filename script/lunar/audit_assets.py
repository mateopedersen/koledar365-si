"""Inspect actual PDF objects, raster resolution, embedded fonts, ICC and paired WebPs."""
import json,hashlib,math,re
from pathlib import Path
from PIL import Image,ImageCms,ImageDraw
import numpy as np
from pypdf import PdfReader
from pypdf.generic import ContentStream
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'public';EV=ROOT/'evidence/lunar';PROOFS=ROOT.parent/'lunar-proofs';PROOFS.mkdir(exist_ok=True)
assets=[]
for y in range(2027,2031):assets+=json.loads((EV/f'assets-{y}.json').read_text())['assets']
assert len(assets)==208 and len({a['assetId'] for a in assets})==208
results=[]
for a in assets:
 pdf=PUB/a['pdf']['path'];webp=PUB/a['webp']['path'];r=PdfReader(pdf);assert len(r.pages)==1
 page=r.pages[0];w,h=float(page.mediabox.width),float(page.mediabox.height)
 assert abs(w-a['paperMm']['width']*72/25.4)<.01 and abs(h-a['paperMm']['height']*72/25.4)<.01
 assert pdf.stem==webp.stem
 for kind in ['pdf','webp','preview']:
  p=PUB/a[kind]['path'];assert p.stat().st_size<25*1024*1024
  assert hashlib.sha256(p.read_bytes()).hexdigest()==a[kind]['sha256']
 intent=r.trailer['/Root']['/OutputIntents'][0].get_object();icc=intent['/DestOutputProfile'].get_object();assert icc['/N']==4
 assert hashlib.sha256(icc.get_data()).hexdigest()==a['pdf']['iccSha256']
 fonts=page['/Resources']['/Font'];assert fonts
 for f in fonts.values():
  d=f.get_object();fd=d['/FontDescriptor'].get_object();assert any(k in fd for k in ['/FontFile','/FontFile2','/FontFile3']);assert '/ToUnicode' in d
 objects=page['/Resources'].get('/XObject',{});ppis=[];stack=[];matrix=(1,0,0,1,0,0);images=0
 for args,op in ContentStream(page.get_contents(),r).operations:
  assert op not in [b'rg',b'RG'], 'RGB vector in print'
  if op==b'q':stack.append(matrix)
  elif op==b'Q':matrix=stack.pop()
  elif op==b'cm':
   x,y,z,t,e,f=map(float,args);a0,b0,c0,d0,e0,f0=matrix;matrix=(a0*x+c0*y,b0*x+d0*y,a0*z+c0*t,b0*z+d0*t,a0*e+c0*f+e0,b0*e+d0*f+f0)
  elif op==b'Do':
   ob=objects[args[0]].get_object()
   if ob.get('/Subtype')=='/Image':
    assert ob['/ColorSpace']=='/DeviceCMYK';images+=1
    ppis += [float(ob['/Width'])*72/math.hypot(matrix[0],matrix[1]),float(ob['/Height'])*72/math.hypot(matrix[2],matrix[3])]
 expected=366 if a['year']==2028 else 365
 if a['month']:
  import calendar
  expected=calendar.monthrange(a['year'],a['month'])[1]
 assert images==expected,(a['assetId'],images,expected)
 assert min(ppis)>=600-.01
 text=page.extract_text();assert 'koledar365.si' in text and str(a['year']) in text
 assert not any(x in text for x in ['\ufffd','kalendorius','Fullmoonology'])
 im=Image.open(webp);assert im.size==(a['webp']['targetWidthPixels'],a['webp']['targetHeightPixels']);assert im.mode=='RGB' and im.info.get('icc_profile')
 im.thumbnail((1200,1200));rgb=im.convert('RGB')
 doc=pdfium.PdfDocument(str(pdf));pg=doc[0];proof=pg.render(scale=100/72).to_pil().convert('RGB');proof.save(PROOFS/(a['assetId']+'.png'));preview=proof.copy();preview.thumbnail((1200,1200));rgb=rgb.resize(preview.size)
 difference=float(np.mean(np.abs(np.asarray(rgb,dtype=float)-np.asarray(preview,dtype=float))));assert difference<45,(a['assetId'],difference)
 (PROOFS/(a['assetId']+'.txt')).write_text(text)
 pg.close();doc.close()
 a['status']='generated_and_technically_verified';a['fontEmbeddingCheck']='passed';a['pdf']['measuredMinimumEffectivePpi']=min(ppis)
 results.append({'assetId':a['assetId'],'status':'passed','images':images,'minimumPpi':min(ppis),'fontsEmbedded':True,'cmykOnly':True,'outputIntent':True,'webpPixels':[a['webp']['targetWidthPixels'],a['webp']['targetHeightPixels']],'pairMeanRgbDifferenceAfterCmykProof':difference,'pdfBytes':pdf.stat().st_size})
 print(a['assetId'],'passed',flush=True)
(EV/'assets-audit.json').write_text(json.dumps({'status':'passed','count':len(results),'results':results},indent=2))
(ROOT/'data/lunar/assets.json').write_text(json.dumps({'count':208,'assets':assets},ensure_ascii=False,indent=2))
for batch in range(13):
 sheet=Image.new('RGB',(1600,2240),'#dce1e2');draw=ImageDraw.Draw(sheet)
 for i,a in enumerate(assets[batch*16:(batch+1)*16]):
  im=Image.open(PROOFS/(a['assetId']+'.png'));im.thumbnail((390,530));x=i%4*400;y=i//4*560;sheet.paste(im,(x+(400-im.width)//2,y+24));draw.text((x+10,y+5),a['assetId'],fill='black')
 sheet.save(PROOFS/f'sheet-{batch+1:02}.jpg',quality=90)
