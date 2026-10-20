import cities from '../cities.js';
const description=symbol=>/thunder/.test(symbol)?'Nevihte':/sleet/.test(symbol)?'Dež s snegom':/snow/.test(symbol)?'Sneženje':/heavyrain/.test(symbol)?'Močan dež':/lightrain/.test(symbol)?'Rahel dež':/rain/.test(symbol)?'Dež':/fog/.test(symbol)?'Megla':/clearsky/.test(symbol)?'Jasno':/fair/.test(symbol)?'Pretežno jasno':/partlycloudy/.test(symbol)?'Delno oblačno':'Oblačno';
export async function onRequestGet({request,params,waitUntil}){
 const city=cities.find(row=>row.id===params.id);if(!city)return Response.json({error:'Mesto ni v seznamu.'},{status:404});
 const key=new Request(new URL('/vreme/'+city.id+'/',request.url)),cache=caches.default,now=Date.now();let cached=await cache.match(key),record=cached?await cached.json():null;
 try{
  if(!record||Date.parse(record.expires_at)<=now){
   const point=city.coordinates[0],headers={'User-Agent':'Koledar365/1.0 (+https://koledar365.si/kontakt/; koledar365@gmail.com)'};
   if(record?.last_modified)headers['If-Modified-Since']=record.last_modified;
   const upstream=await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${point.lat.toFixed(4)}&lon=${point.lon.toFixed(4)}`,{headers});
   if(!upstream.ok&&!(upstream.status===304&&record))throw Error('Vremenski vir trenutno ni na voljo.');
   const data=upstream.status===304?record.data:await upstream.json(),expires=Date.parse(upstream.headers.get('Expires'));
   const maxAge=Number(upstream.headers.get('Cache-Control')?.match(/(?:^|,)\s*max-age=(\d+)/i)?.[1]||900);
   record={data,fetched_at:new Date(now).toISOString(),expires_at:new Date(Number.isFinite(expires)?expires:now+maxAge*1000).toISOString(),last_modified:upstream.headers.get('Last-Modified')||record?.last_modified||null};
   // Retain the validator after forecast expiry so the next fetch can be conditional.
   waitUntil(cache.put(key,Response.json(record,{headers:{'Cache-Control':'public, max-age=86400'}})));
  }
  const updated=Date.parse(record.data.properties.meta.updated_at),series=record.data.properties.timeseries;if(!Number.isFinite(updated)||now-updated>43200000||!series?.length)throw Error('Sveža napoved trenutno ni na voljo.');const current=series.reduce((a,b)=>Math.abs(Date.parse(a.time)-now)<Math.abs(Date.parse(b.time)-now)?a:b);if(Math.abs(Date.parse(current.time)-now)>7200000)throw Error('Napoved za trenutni čas ni na voljo.');
  const decorate=row=>{const d=row.data.instant.details,s=row.data.next_1_hours?.summary.symbol_code||row.data.next_6_hours?.summary.symbol_code||'cloudy';return {at:row.time,temperature:d.air_temperature,wind:d.wind_speed,humidity:d.relative_humidity,symbol:s,description:description(s)}};
  return Response.json({city:city.id,city_name:city.name,current:decorate(current),hours:series.filter(row=>Date.parse(row.time)>=now).slice(0,12).map(decorate),updated_at:new Date(updated).toISOString(),fetched_at:record.fetched_at,expires_at:record.expires_at,stale:false,server_now:new Date().toISOString(),source:'MET Norway',license:'CC BY 4.0',kind:'forecast'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){return Response.json({error:'Sveža vremenska napoved trenutno ni na voljo. Poskusite pozneje.',server_now:new Date().toISOString()},{status:503,headers:{'Cache-Control':'no-store'}})}
}
