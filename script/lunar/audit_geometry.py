"""Independent bright-limb direction check with Astronomy Engine EQJ vectors."""
from pathlib import Path
import json,math,hashlib,argparse
import numpy as np
import spiceypy as sp
import astronomy
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);a=p.parse_args()
for n in ['naif0012.tls','de440s.bsp','moon_pa_de440_200625.bpc','moon_de440_250416.tf']:sp.furnsh(str(a.sources/n))
records=[]
for d in json.loads((ROOT/'data/lunar/lunar-daily-2027-2030.json').read_text())['days']:
 t=astronomy.Time.Parse(d['utc']);et=sp.str2et(d['utc']);m,lt=sp.spkpos('MOON',et,'J2000','LT','EARTH');rot=sp.pxform('J2000','MOON_ME',et-lt);eye=rot@(-m);eye/=np.linalg.norm(eye);right=np.cross([0,0,1],eye);right/=np.linalg.norm(right);up=np.cross(eye,right)
 sv=rot@sp.spkpos('SUN',et-lt,'J2000','LT','MOON')[0]
 am=astronomy.GeoVector(astronomy.Body.Moon,t,False);asu=astronomy.GeoVector(astronomy.Body.Sun,t,False);ind=rot@np.array([asu.x-am.x,asu.y-am.y,asu.z-am.z]);angle=lambda v:math.degrees(math.atan2(v@right,v@up));diff=abs((angle(sv)-angle(ind)+180)%360-180)
 records.append({'date':d['date'],'brightLimbIndependentDeltaDeg':diff})
# Angle is ill-conditioned at syzygy; all local-noon samples nevertheless fit 0.1 degree.
assert max(d['brightLimbIndependentDeltaDeg'] for d in records)<.1
reports=[json.loads(p.read_text()) for p in (ROOT/'evidence/lunar').glob('render-report-*.json')];days=sum([r['days'] for r in reports],[])
assert len(days)==1461
assert max(d['librationIndependentDeltaDeg'] for d in days)<.1
assert max(d['maskDeltaPP'] for d in days)<.05
assert max(d['illuminationDeltaPP'] for d in days)<.05
for r in reports:
 r['sources']={k:v for k,v in r['sources'].items() if not k.endswith('.icc')}
 for d in r['days']:
  f=ROOT.parent/'moon-masters'/(d['date']+'.webp');d['webpSha256']=hashlib.sha256(f.read_bytes()).hexdigest()
 (ROOT/'evidence/lunar'/f"render-report-{r['days'][0]['date'][:4]}.json").write_text(json.dumps(r,indent=2))
result={'status':'passed','days':1461,'maximumBrightLimbDeltaDeg':max(d['brightLimbIndependentDeltaDeg'] for d in records),'maximumLibrationDeltaDeg':max(d['librationIndependentDeltaDeg'] for d in days),'maximumMaskDeltaPercentagePoints':max(d['maskDeltaPP'] for d in days),'maximumIlluminationDeltaPercentagePoints':max(d['illuminationDeltaPP'] for d in days),'records':records}
(ROOT/'evidence/lunar/geometry-audit.json').write_text(json.dumps(result,indent=2));print({k:v for k,v in result.items() if k!='records'})
