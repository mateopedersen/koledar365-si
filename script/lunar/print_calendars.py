"""Produce matching vector CMYK PDF and 600 ppi sRGB WebP from one layout."""
import argparse,calendar,hashlib,io,json,math,tempfile
from pathlib import Path
from PIL import Image,ImageCms
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader,PdfWriter
from pypdf.generic import DictionaryObject,NameObject,ArrayObject,TextStringObject,DecodedStreamObject,NumberObject
import pypdfium2 as pdfium
ROOT=Path(__file__).resolve().parents[2];PUB=ROOT/'public';DATA=ROOT/'data/lunar'
MONTHS='januar februar marec april maj junij julij avgust september oktober november december'.split();SHORT='pon tor sre čet pet sob ned'.split()
NAMES={'new_moon':'Mlaj','first_quarter':'Prvi krajec','full_moon':'Polna luna','last_quarter':'Zadnji krajec'}
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def pct(d):return f"{d['illuminationFraction']*100:.1f}".replace('.',',')+' %'
DAYS=json.loads((DATA/'lunar-daily-2027-2030.json').read_text())['days'];EVENTS=json.loads((DATA/'lunar-events-2027-2030.json').read_text())['events']
def monthdays(y,m):return [d for d in DAYS if d['date'].startswith(f'{y}-{m:02}-')]
def events(y,m=None):return [d for d in EVENTS if d['localDate'].startswith(f'{y}-'+(f'{m:02}-' if m else ''))]
def eventline(e,year=False):
 d=e['localDate'].split('-');return f"{NAMES[e['phaseKey']]}  {int(d[2])}. {int(d[1])}.  {e['localTime'].replace(':','.')}  UTC{e['localDateTime'][-6:]}"
class Draw:
 def __init__(self,file,a,cmyk,profile):
  self.a=a;self.w=a['paperMm']['width']*72/25.4;self.h=a['paperMm']['height']*72/25.4;self.c=canvas.Canvas(str(file),pagesize=(self.w,self.h),pageCompression=1,invariant=1,initialFontName='Lunar');self.cm=cmyk;self.profile=profile;self.dark=a['variantId'] in ['M01','Y01'];self.bg='#102331' if self.dark else '#ffffff';self.fg='#f1f5f5' if self.dark else '#182f38';self.line='#3f5360' if self.dark else '#d7dfdf';self.rasters=[]
  self.c.setTitle(('Lunin koledar '+str(a['year']))+' - '+a['variantLabelSl']);self.c.setAuthor('koledar365.si');self.c.setSubject('Luna ob 12.00 v Sloveniji; USNO / JPL / NASA SVS')
  self.rect(0,0,self.w,self.h,self.bg)
 def color(self,hex,stroke=False):
  rgb=tuple(int(hex[i:i+2],16)/255 for i in (1,3,5));c=self.c
  if self.cm:
   # Every vector color is converted by the same output profile as the raster.
   im=Image.new('RGB',(1,1),tuple(round(v*255) for v in rgb));v=ImageCms.applyTransform(im,self.profile).getpixel((0,0));getattr(c,'setStrokeColorCMYK' if stroke else 'setFillColorCMYK')(*(n/255 for n in v))
  else:getattr(c,'setStrokeColorRGB' if stroke else 'setFillColorRGB')(*rgb)
 def rect(self,x,y,w,h,color):self.color(color);self.c.rect(x,self.h-y-h,w,h,fill=1,stroke=0)
 def ln(self,x,y,x2,y2):self.color(self.line,True);self.c.setLineWidth(.35);self.c.line(x,self.h-y,x2,self.h-y2)
 def text(self,x,y,s,size=9,bold=False,color=None,center=False):
  self.color(color or self.fg);self.c.setFont('LunarBold' if bold else 'Lunar',size);fn=self.c.drawCentredString if center else self.c.drawString;fn(x,self.h-y,s)
  width=pdfmetrics.stringWidth(s,'LunarBold' if bold else 'Lunar',size)
  if x+(width/2 if center else width)>self.w-12 or x-(width/2 if center else 0)<8:raise ValueError(f'Text overflow: {s}')
 def moon(self,d,x,y,diam):
  size=math.ceil(diam*600/72);assert size<=768
  source=ROOT.parent/'moon-masters'/f"{d['date']}.webp";im=Image.open(source).convert('RGBA').resize((size,size),Image.Resampling.LANCZOS);bg=Image.new('RGB',im.size,self.bg);bg.paste(im,mask=im.getchannel('A'))
  if self.cm:
   bg=ImageCms.applyTransform(bg,self.profile);encoded=io.BytesIO();bg.save(encoded,format='JPEG',quality=90,subsampling=0);encoded.seek(0);bg=encoded
  self.c.drawImage(ImageReader(bg),x,self.h-y-diam,diam,diam);self.rasters.append({'date':d['date'],'pixels':size,'points':diam,'ppi':size*72/diam})
 def footer(self):
  y=self.h-32;self.ln(30,y-10,self.w-30,y-10);self.text(30,y,'koledar365.si  ·  '+str(self.a['year'])+'  ·  Luna ob 12.00 v Sloveniji',7)
  self.text(30,y+12,"USNO / JPL DE440  ·  Površje: NASA's Scientific Visualization Studio  ·  Sever Lune zgoraj",6.7)
 def finish(self):self.footer();self.c.showPage();self.c.save()
 def monthly(self):
  a=self.a;y=a['year'];m=a['month'];v=a['variantId'];ds=monthdays(y,m);ev=events(y,m);weeks=calendar.monthcalendar(y,m);top=108
  self.text(32,31,'LUNIN KOLEDAR',10,True);self.text(32,68,MONTHS[m-1].capitalize(),30,True);self.text(self.w-120,68,str(y),26);self.text(32,88,a['variantLabelSl']+'  ·  Osvetljenost ob 12.00',9)
  if v in ['M01','M02']:
   gw=self.w-64;gh=505 if v=='M01' else 425;cw=gw/7;rh=gh/6
   for i,s in enumerate(SHORT):self.text(32+cw*(i+.5),top,s,9,center=True)
   for d in ds:
    day=int(d['date'][-2:]);idx=calendar.monthrange(y,m)[0]+day-1;r,c=divmod(idx,7);x=32+c*cw;yy=top+10+r*rh
    self.ln(x,yy,x+cw-4,yy);self.text(x+6,yy+13,str(day),9,True);diam=52 if v=='M01' else 34;self.moon(d,x+(cw-diam)/2,yy+18,diam);self.text(x+cw/2,yy+rh-4,pct(d),8,center=True)
    if d['eventIds']:self.text(x+cw-14,yy+13,'◆',6,color='#c19a51' if self.dark else '#80602c')
   eY=top+gh+35;self.text(32,eY,'Glavne lunine mene',11,True)
   for i,e in enumerate(ev):self.text(32,eY+19+i*17,eventline(e),8.5)
   if v=='M02':
    ny=eY+20+len(ev)*17;self.text(32,ny,'Opombe',8)
    for n in range(1,4):self.ln(32,ny+n*24,self.w-32,ny+n*24)
  elif v=='M03':
   gw=505;cw=gw/7;rh=62
   for i,s in enumerate(SHORT):self.text(32+cw*(i+.5),top,s,9,center=True)
   for d in ds:
    day=int(d['date'][-2:]);r,c=divmod(calendar.monthrange(y,m)[0]+day-1,7);x=32+c*cw;yy=top+12+r*rh
    self.ln(x,yy,x+cw-5,yy);self.text(x+4,yy+12,str(day),8,True);self.moon(d,x+19,yy+13,37);self.text(x+cw/2,yy+60,pct(d),7.5,center=True)
   x=565;self.text(x,top,'Glavne lunine mene',12,True)
   for i,e in enumerate(ev):self.text(x,top+25+i*38,NAMES[e['phaseKey']],9,True);self.text(x,top+39+i*38,eventline(e).split('  ',1)[1],8)
   yy=top+30+len(ev)*38;self.text(x,yy,'Opazovalne opombe',11,True)
   for n in range(1,7):self.ln(x,yy+n*22,self.w-32,yy+n*22)
  else:
   gw=570;cw=gw/7;rh=67
   for i,s in enumerate(SHORT):self.text(32+cw*(i+.5),top,s,9,center=True)
   for ri,week in enumerate(weeks):
    yy=top+10+ri*rh;self.rect(32,yy,gw,rh-5,'#f1f5f4' if ri%2==0 else '#ffffff');dates=[]
    for ci,day in enumerate(week):
     if not day:continue
     d=ds[day-1];dates.append(d['date']);x=32+ci*cw;self.text(x+5,yy+12,str(day),8,True);self.moon(d,x+27,yy+8,30);self.text(x+cw/2,yy+48,pct(d),8,center=True);self.text(x+cw/2,yy+59,'raste' if d['waxing'] else 'pojema',7,center=True)
    x=622;ee=[e for e in ev if e['localDate'] in dates]
    if ee:
     for j,e in enumerate(ee):self.text(x,yy+12+j*23,NAMES[e['phaseKey']],8,True);self.text(x,yy+23+j*23,eventline(e).split('  ',1)[1],7)
    else:self.text(x,yy+12,'Opombe',8)
    self.ln(x,yy+rh-8,self.w-32,yy+rh-8)
 def annual(self):
  a=self.a;y=a['year'];v=a['variantId'];self.text(32,36,'LUNIN KOLEDAR',14,True);self.text(32,75,str(y),36,True);self.text(155,72,a['variantLabelSl'],13)
  if v=='Y01':
   x0=100;cw=(self.w-x0-32)/31;rh=(self.h-174)/12
   for day in range(1,32):self.text(x0+(day-.5)*cw,108,str(day),8,center=True)
   for m in range(1,13):
    yy=120+(m-1)*rh;self.text(32,yy+19,MONTHS[m-1][:3],9,True);self.ln(32,yy+rh-3,self.w-32,yy+rh-3)
    for d in monthdays(y,m):
     day=int(d['date'][-2:]);diam=min(cw-6,rh-17);x=x0+(day-1)*cw+(cw-diam)/2;self.moon(d,x,yy,diam)
     if d['eventIds']:self.text(x+diam/2,yy+diam+9,'◆',6,center=True,color='#c19a51' if self.dark else '#80602c')
   self.text(32,self.h-57,'◆ Glavna lunina mena · Točni časi in dnevna osvetljenost: koledar365.si/lunin-koledar/'+str(y)+'/',8)
  elif v=='Y02':
   # A vertical day index and twelve month columns form an office year atlas.
   cw=(self.w-90)/12;rh=(self.h-190)/31
   for m in range(1,13):self.text(58+(m-.5)*cw,107,MONTHS[m-1][:3],10,True,center=True)
   for day in range(1,32):
    yy=119+(day-1)*rh;self.text(33,yy+13,str(day),8,True);self.ln(30,yy+rh,self.w-32,yy+rh)
    for m in range(1,13):
     ds=monthdays(y,m)
     if day>len(ds):continue
     d=ds[day-1];x=58+(m-1)*cw;self.moon(d,x+8,yy,16);self.text(x+32,yy+11,SHORT[d['weekdayMonday']-1],7)
     if d['eventIds']:self.text(x+cw-13,yy+11,'◆',6,color='#80602c')
   self.text(32,self.h-53,'◆ Glavna lunina mena · Opombe:',8);self.ln(210,self.h-53,self.w-32,self.h-53)
  elif v=='Y03':
   bw=(self.w-84)/3;bh=(self.h-165)/4
   for m in range(1,13):
    r,c=divmod(m-1,3);x=32+c*(bw+10);yy=106+r*bh;self.text(x,yy,MONTHS[m-1].capitalize(),13,True);cw=bw/7;rh=26
    for i,s in enumerate(SHORT):self.text(x+cw*(i+.5),yy+17,s,7,center=True)
    for d in monthdays(y,m):
     day=int(d['date'][-2:]);rr,cc=divmod(calendar.monthrange(y,m)[0]+day-1,7);dx=x+cc*cw;dy=yy+24+rr*rh;self.text(dx+3,dy+7,str(day),6);self.moon(d,dx+12,dy,19)
    for i,e in enumerate(events(y,m)):self.text(x,yy+194+i*10,eventline(e),6.7)
    self.ln(x,yy+bh-14,x+bw,yy+bh-14)
  else:
   bw=(self.w-82)/2;bh=(self.h-153)/6
   for m in range(1,13):
    r,c=divmod(m-1,2);x=32+c*(bw+18);yy=108+r*bh;self.text(x,yy,MONTHS[m-1].capitalize(),11,True);cw=(bw-180)/16
    for d in monthdays(y,m):
     day=int(d['date'][-2:]);rr,cc=divmod(day-1,16);dx=x+cc*cw;dy=yy+10+rr*35;self.moon(d,dx,dy,18);self.text(dx+9,dy+28,str(day),6.5,center=True)
    for i,e in enumerate(events(y,m)):self.text(x+bw-173,yy+11+i*17,eventline(e),6.7)
    self.ln(x,yy+bh-10,x+bw,yy+bh-10)

def main():
 p=argparse.ArgumentParser();p.add_argument('--profile',type=Path,required=True);p.add_argument('--asset');p.add_argument('--year',type=int);a=p.parse_args()
 for name,file in [('Lunar','DejaVuSans.ttf'),('LunarBold','DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,str(ROOT/'app/assets/fonts'/file)))
 srgb=ImageCms.createProfile('sRGB');cmyk=ImageCms.getOpenProfile(str(a.profile));transform=ImageCms.buildTransformFromOpenProfiles(srgb,cmyk,'RGB','CMYK');srgbbytes=ImageCms.ImageCmsProfile(srgb).tobytes();iccbytes=a.profile.read_bytes()
 assets=json.loads((DATA/'uretim-manifesti-plan.json').read_text())['assets'];results=[]
 for asset in assets:
  if a.asset and asset['assetId']!=a.asset:continue
  if a.year and asset['year']!=a.year:continue
  pdf=PUB/asset['pdf']['path'];webp=PUB/asset['webp']['path'];preview=PUB/asset['preview']['path'];pdf.parent.mkdir(parents=True,exist_ok=True);preview.parent.mkdir(parents=True,exist_ok=True)
  with tempfile.TemporaryDirectory() as tmp:
   tmp=Path(tmp)
   for cm in [False,True]:
    file=tmp/('cmyk.pdf' if cm else 'rgb.pdf');d=Draw(file,asset,cm,transform);d.monthly() if asset['month'] else d.annual();d.finish()
   writer=PdfWriter(clone_from=str(tmp/'cmyk.pdf'));stream=DecodedStreamObject();stream.set_data(iccbytes);stream[NameObject('/N')]=NumberObject(4);ref=writer._add_object(stream)
   intent=DictionaryObject({NameObject('/Type'):NameObject('/OutputIntent'),NameObject('/S'):NameObject('/GTS_PDFX'),NameObject('/OutputConditionIdentifier'):TextStringObject('Artifex CMYK SWOP Profile'),NameObject('/Info'):TextStringObject('default_cmyk.icc; no PDF/X conformance claim'),NameObject('/DestOutputProfile'):ref});writer._root_object[NameObject('/OutputIntents')]=ArrayObject([writer._add_object(intent)]);writer.write(str(pdf))
   doc=pdfium.PdfDocument(str(tmp/'rgb.pdf'));page=doc[0];bitmap=page.render(scale=600/72);im=bitmap.to_pil().convert('RGB');width=asset['webp']['targetWidthPixels'];height=asset['webp']['targetHeightPixels'];assert abs(im.width-width)<=1 and abs(im.height-height)<=1;im=im.crop((0,0,width,height));im.save(webp,quality=95,method=4,icc_profile=srgbbytes)
   im.thumbnail((960,960));im.save(preview,quality=86,icc_profile=srgbbytes);asset['preview'].update(width=im.width,height=im.height)
   page.close();doc.close()
  for kind,mime in [('pdf','application/pdf'),('webp','image/webp'),('preview','image/webp')]:
   f=PUB/asset[kind]['path'];asset[kind].update(bytes=f.stat().st_size,sha256=sha(f),mimeType=mime)
  asset['webp'].update(width=width,height=height,iccProfile='sRGB');asset['pdf'].update(iccProfile='default_cmyk.icc',iccSha256=sha(a.profile),minimumEffectivePpi=min(r['ppi'] for r in d.rasters));asset.update(status='generated_pending_visual_qa',dataSha256=sha(DATA/'lunar-daily-2027-2030.json'),renderQaStatus='pending',fontEmbeddingCheck='pending')
  results.append(asset);(ROOT/'evidence/lunar'/('assets-'+(a.asset or str(a.year or 'all'))+'.json')).write_text(json.dumps({'assets':results},ensure_ascii=False,indent=2));print(asset['assetId'],pdf.stat().st_size,webp.stat().st_size,flush=True)
if __name__=='__main__':main()
