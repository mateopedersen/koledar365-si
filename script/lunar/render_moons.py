"""Deterministic geocentric lunar-north-up render, DE440 ME421 / LROC / LOLA.
Orthographic sphere; elevation-derived normals and terrain shadow ray sampling.
Lommel-Seeliger reflectance approximation. No atmosphere, Earthshine or eclipse.
"""
import argparse,json,hashlib,math,time
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
import spiceypy as sp
import astronomy
ROOT=Path(__file__).resolve().parents[2]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def unit(v):return v/np.linalg.norm(v,axis=-1,keepdims=True)
def main():
 p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);p.add_argument('--date');p.add_argument('--year',type=int);p.add_argument('--size',type=int,default=768);p.add_argument('--reference-utc');p.add_argument('--output',type=Path);a=p.parse_args();s=a.sources
 for f in ['naif0012.tls','de440s.bsp','moon_pa_de440_200625.bpc','moon_de440_250416.tf']:sp.furnsh(str(s/f))
 albedo=np.asarray(Image.open(s/'lroc_color_16bit_srgb_8k.tif').convert('RGB'),dtype=np.float32)/255
 dem=np.asarray(Image.open(s/'ldem_16.tif'),dtype=np.float32)
 assert dem.min()>-20 and dem.max()<20
 gy,gx=np.gradient(dem); lat=np.linspace(np.pi/2,-np.pi/2,dem.shape[0])[:,None]
 east=gx/(1737.4*2*np.pi/dem.shape[1]*np.maximum(np.cos(lat),.01));north=-gy/(1737.4*np.pi/dem.shape[0])
 def sample(arr,n):
  lon=np.arctan2(n[...,1],n[...,0]);lat=np.arcsin(np.clip(n[...,2],-1,1));u=(lon/(2*np.pi)+.5)*arr.shape[1]-.5;v=(.5-lat/np.pi)*arr.shape[0]-.5
  if arr.ndim==3:return np.stack([map_coordinates(arr[...,i],[v,u],order=1,mode='nearest') for i in range(3)],-1)
  return map_coordinates(arr,[v,u],order=1,mode='nearest')
 n=a.size;q=(np.arange(n)+.5-n/2)/(n/2-2);xx,yy=np.meshgrid(q,-q);mask=xx*xx+yy*yy<1;x=xx[mask];y=yy[mask];z=np.sqrt(1-x*x-y*y)
 rows=json.loads((ROOT/'data/lunar/lunar-daily-2027-2030.json').read_text())['days'];out=a.output or ROOT.parent/'moon-masters';out.mkdir(parents=True,exist_ok=True);reports=[]
 if a.reference_utc:
  rows=[{'date':a.reference_utc[:10],'utc':a.reference_utc,'illuminationFraction':astronomy.Illumination(astronomy.Body.Moon,astronomy.Time.Parse(a.reference_utc)).phase_fraction}]
 for ix,row in enumerate(rows):
  if a.date and row['date']!=a.date:continue
  if a.year and not row['date'].startswith(str(a.year)):continue
  et=sp.str2et(row['utc']);m,lt=sp.spkpos('MOON',et,'J2000','LT','EARTH');em=et-lt;rot=sp.pxform('J2000','MOON_ME',em)
  eye=unit(rot@(-m));sun=unit(rot@sp.spkpos('SUN',em,'J2000','LT','MOON')[0]);right=unit(np.cross([0,0,1],eye));up=np.cross(eye,right)
  surface=(x[:,None]*right+y[:,None]*up+z[:,None]*eye).astype(np.float32)
  heights=sample(dem,surface);long=np.arctan2(surface[:,1],surface[:,0]);lati=np.arcsin(surface[:,2]);e=np.stack([-np.sin(long),np.cos(long),np.zeros_like(long)],-1);no=np.stack([-np.sin(lati)*np.cos(long),-np.sin(lati)*np.sin(long),np.cos(lati)],-1)
  normal=unit(surface-sample(east,surface)[:,None]*e-sample(north,surface)[:,None]*no)
  mu0=normal@sun;mu=normal@eye;geom=surface@sun
  lit=mu0>0;positions=surface*(1737.4+heights[:,None]);candidates=np.flatnonzero(lit&(geom<.25))
  # Elevation ray sampling resolves local terrain shadows at this DEM's ~2 km grid.
  for distance in [1.5,3,5,8,12,18,27,40,60,90]:
   if not len(candidates):break
   pts=positions[candidates]+distance*sun;radius=np.linalg.norm(pts,axis=1);alt=sample(dem,pts/radius[:,None])+1737.4
   blocked=radius<alt+.02;lit[candidates[blocked]]=False;candidates=candidates[~blocked]
  reflect=np.where(lit,2*np.maximum(mu0,0)/np.maximum(mu0+np.maximum(mu,0),1e-5),0)
  color=sample(albedo,surface);linear=np.where(color<=.04045,color/12.92,((color+.055)/1.055)**2.4)
  value=np.clip(linear*reflect[:,None],0,1);rgb=np.where(value<=.0031308,12.92*value,1.055*value**(1/2.4)-.055)
  image=np.zeros((n,n,4),dtype=np.uint8);image[mask,:3]=np.clip(rgb*255,0,255).astype(np.uint8);image[mask,3]=255;im=Image.fromarray(image);file=out/(row['date']+'.png');im.save(file,optimize=True)
  im.save(out/(row['date']+'.webp'),lossless=True)
  im.resize((96,96),Image.Resampling.LANCZOS).save(out/(row['date']+'-small.webp'),quality=85)
  lib=astronomy.Libration(astronomy.Time.Parse(row['utc']));elon=math.degrees(math.atan2(eye[1],eye[0]));elat=math.degrees(math.asin(eye[2]));k=(1+float(eye@sun))/2
  reports.append(dict(date=row['date'],utc=row['utc'],orientation='lunar_north_up',frame='MOON_ME_DE440_ME421',subEarthLongitude=elon,subEarthLatitude=elat,librationIndependentDeltaDeg=max(abs(elon-lib.elon),abs(elat-lib.elat)),illuminationDeltaPP=abs(k-row['illuminationFraction'])*100,maskDeltaPP=abs(np.mean(geom>0)-row['illuminationFraction'])*100,sha256=sha(file),width=n,height=n))
  if ix%30==0 or a.date:print(row['date'],reports[-1],flush=True)
 name='render-reference.json' if a.reference_utc else 'render-sample.json' if a.date else f'render-report-{a.year or 2027}.json'
 (ROOT/'evidence/lunar'/name).write_text(json.dumps(dict(renderer='lunar-ray-1',sources={f.name:sha(f) for f in [s/n for n in ['naif0012.tls','de440s.bsp','moon_pa_de440_200625.bpc','moon_de440_250416.tf','ldem_16.tif','lroc_color_16bit_srgb_8k.tif']]},modelLimits=['orthographic sphere silhouette','DEM normals and sampled terrain shadows','Lommel-Seeliger approximation; no measured photometric calibration','no eclipse/atmosphere/Earthshine'],days=reports),indent=2))
if __name__=='__main__':main()
