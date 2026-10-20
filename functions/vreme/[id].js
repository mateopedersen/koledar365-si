import cities from '../cities.js';
const description=symbol=>/thunder/.test(symbol)?'Nevihte':/sleet/.test(symbol)?'Dež s snegom':/snow/.test(symbol)?'Sneženje':/heavyrain/.test(symbol)?'Močan dež':/lightrain/.test(symbol)?'Rahel dež':/rain/.test(symbol)?'Dež':/fog/.test(symbol)?'Megla':/clearsky/.test(symbol)?'Jasno':/fair/.test(symbol)?'Pretežno jasno':/partlycloudy/.test(symbol)?'Delno oblačno':'Oblačno';
function forecast(record,now){
 const updated=Date.parse(record?.data?.properties?.meta?.updated_at),series=record?.data?.properties?.timeseries;
 if(!Number.isFinite(updated)||updated>now+300000||now-updated>43200000||!Array.isArray(series)||!series.length)return null;
 // Use the current forecast interval, rather than jumping to a future hour at :30.
 const past=series.filter(row=>Date.parse(row.time)<=now),current=past.length?past[past.length-1]:series[0];
 if(Math.abs(Date.parse(current.time)-now)>7200000||!Number.isFinite(current.data?.instant?.details?.air_temperature))return null;
 return{updated,series,current};
}
export async function onRequestGet({request,params,waitUntil}){
 const city=cities.find(row=>row.id===params.id);if(!city)return Response.json({error:'Mesto ni v seznamu.'},{status:404});
 const key=new Request(new URL('/vreme/'+city.id+'/',request.url)),cache=caches.default,now=Date.now();let record;
 try{record=await(await cache.match(key))?.json()}catch{}
 const refresh=async()=>{
  const point=city.coordinates[0],headers={'User-Agent':'Koledar365/1.0 (+https://koledar365.si/kontakt/; koledar365@gmail.com)'};
  if(record?.last_modified)headers['If-Modified-Since']=record.last_modified;
  const upstream=await fetch('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+point.lat.toFixed(4)+'&lon='+point.lon.toFixed(4),{headers,signal:AbortSignal.timeout(6500)});
  if(!upstream.ok&&!(upstream.status===304&&record))throw Error('Weather source unavailable');
  const data=upstream.status===304?record.data:await upstream.json(),expires=Date.parse(upstream.headers.get('Expires')),maxAge=Number(upstream.headers.get('Cache-Control')?.match(/(?:^|,)\s*max-age=(\d+)/i)?.[1]||900);
  const next={data,fetched_at:new Date(now).toISOString(),expires_at:new Date(Math.max(now+60000,Number.isFinite(expires)?expires:now+maxAge*1000)).toISOString(),last_modified:upstream.headers.get('Last-Modified')||record?.last_modified||null};
  if(!forecast(next,now))throw Error('No valid current forecast');
  await cache.put(key,Response.json(next,{headers:{'Cache-Control':'public, max-age=86400'}}));return next;
 };
 try{
  const existing=forecast(record,now),expired=!(Date.parse(record?.expires_at)>now);
  let stale=false;
  if(existing){
   stale=expired;
   if(expired&&!(record.retry_after>now)){
    // Return the still-valid model immediately; refresh its upstream validator in the background.
    waitUntil(refresh().catch(async()=>{await cache.put(key,Response.json({...record,retry_after:now+60000},{headers:{'Cache-Control':'public, max-age=86400'}}))}));
   }
  }else record=await refresh();
  const {updated,series,current}=forecast(record,now);
  const decorate=row=>{const d=row.data.instant.details,s=row.data.next_1_hours?.summary.symbol_code||row.data.next_6_hours?.summary.symbol_code||'cloudy';return{at:row.time,temperature:d.air_temperature,wind:d.wind_speed,humidity:d.relative_humidity,symbol:s,description:description(s)}};
  return Response.json({city:city.id,city_name:city.name,current:decorate(current),hours:series.filter(row=>Date.parse(row.time)>=now).slice(0,12).map(decorate),updated_at:new Date(updated).toISOString(),fetched_at:record.fetched_at,expires_at:record.expires_at,stale,server_now:new Date(now).toISOString(),source:'MET Norway',license:'CC BY 4.0',kind:'forecast'},{headers:{'Cache-Control':stale?'public, max-age=15':'public, max-age=60'}});
 }catch{return Response.json({error:'Sveža vremenska napoved trenutno ni na voljo. Poskusite pozneje.',server_now:new Date(now).toISOString()},{status:503,headers:{'Cache-Control':'no-store'}})}
}
