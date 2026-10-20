// Birth inputs remain in memory on this device. No storage or network is used here.
export const zone = 'Europe/Ljubljana';
export const normalize = angle => (angle % 360 + 360) % 360;
export function localDate(instant = new Date(), timeZone = zone) {
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone, year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant);
  const get = type => parts.find(p=>p.type===type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function wallTimeCandidates(day, clock, timeZone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(clock)) throw Error('Vnesite veljaven datum in uro rojstva.');
  const [year,month,date]=day.split('-').map(Number), [hour,minute]=clock.split(':').map(Number);
  const naive=Date.UTC(year,month-1,date,hour,minute);
  const check=new Date(naive);
  if (check.getUTCFullYear()!==year||check.getUTCMonth()!==month-1||check.getUTCDate()!==date||hour>23||minute>59) throw Error('Datum ali ura ni veljavna.');
  let formatter;
  try {formatter=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});} catch {throw Error('Preverite časovni pas, na primer Europe/Ljubljana.');}
  const fields=ms=>Object.fromEntries(formatter.formatToParts(new Date(ms)).filter(p=>p.type!=='literal').map(p=>[p.type,Number(p.value)]));
  const offsets=new Set();
  for(let delta=-36;delta<=36;delta+=6){const ms=naive+delta*3600000,p=fields(ms);offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-ms);}
  return [...offsets].map(offset=>naive-offset).filter(ms=>{const p=fields(ms);return p.year===year&&p.month===month&&p.day===date&&p.hour===hour&&p.minute===minute;}).sort((a,b)=>a-b).map(ms=>new Date(ms));
}
export function ascendantLongitude(siderealHours, obliquityDegrees, latitude, longitude) {
  if (![siderealHours,obliquityDegrees,latitude,longitude].every(Number.isFinite)||Math.abs(latitude)>=90||Math.abs(longitude)>180) throw Error('Preverite zemljepisno širino (−90 do 90) in dolžino (−180 do 180).');
  const rad=Math.PI/180,theta=(siderealHours*15+longitude)*rad,phi=latitude*rad,eps=obliquityDegrees*rad;
  const a=Math.cos(phi)*Math.cos(theta),b=Math.cos(phi)*Math.sin(theta)*Math.cos(eps)+Math.sin(phi)*Math.sin(eps);
  if (Math.hypot(a,b)<1e-9) throw Error('Na tem kraju in ob tej uri je presečišče obzorja z ekliptiko nedoločeno.');
  let angle=Math.atan2(-a,b);
  const east=-Math.sin(theta)*Math.cos(angle)+Math.cos(theta)*Math.sin(angle)*Math.cos(eps);
  if(Math.abs(east)<1e-9)throw Error('Presečišče je na obzorju blizu skrajne lege; izračun je preveč občutljiv.');
  if(east<0)angle+=Math.PI;
  return normalize(angle/rad);
}
export const signIndex = angle => Math.floor(normalize(angle)/30);
