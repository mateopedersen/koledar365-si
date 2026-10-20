import {localDate} from '../public/horoscope/math-v1.mjs';
import profiles from '../data/horoscope/signs.json' with {type:'json'};
const origin=process.env.HOROSCOPE_ORIGIN||'https://koledar365.si',today=localDate(),issues=[];
const headers={'User-Agent':'Mozilla/5.0 (compatible; Koledar365Freshness/1.0; +https://koledar365.si/)'};
const api=await fetch(origin+'/horoskop/dnevno.json?date='+today,{headers,cache:'no-store',signal:AbortSignal.timeout(20000)});
if(!api.ok)issues.push('Daily endpoint HTTP '+api.status);else{
  const edition=await api.json();if(edition.local_date!==today||Object.keys(edition.signs||{}).length!==12)issues.push('Daily endpoint date or sign coverage');
}
for(const route of ['/horoskop/',...profiles.map(p=>'/horoskop/'+p.slug+'/')]){
  try{const response=await fetch(origin+route,{headers,cache:'no-store',signal:AbortSignal.timeout(20000)}),html=await response.text();if(!response.ok)issues.push(route+': HTTP '+response.status);if(!html.includes('data-edition-day="'+today+'"'))issues.push(route+': static date is stale');}catch(error){issues.push(route+': '+error.message);}
}
console.log(JSON.stringify({date:today,origin,pages:13,issues},null,2));if(issues.length)process.exit(1);
