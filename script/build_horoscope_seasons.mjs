import fs from 'node:fs';
import * as Astronomy from '../lib/horoscope/vendor/astronomy.mjs';
import profiles from '../data/horoscope/signs.json' with {type:'json'};
const years={};
for(let year=2026;year<=2030;year++){
  years[year]={};
  profiles.forEach((profile,index)=>{
    const start=new Date(Date.UTC(year,profile.start_month-1,14));
    const entry=Astronomy.SearchSunLongitude(index*30,start,20);
    if(!entry)throw Error('Solar ingress not found');
    const exit=Astronomy.SearchSunLongitude((index*30+30)%360,entry.date,40);
    if(!exit)throw Error('Solar egress not found');
    years[year][profile.slug]={starts_at:entry.date.toISOString(),ends_at:exit.date.toISOString()};
  });
}
fs.writeFileSync(new URL('../public/horoscope/seasons-v1.json',import.meta.url),JSON.stringify({method:'Astronomy Engine 2.1.19 · apparent geocentric tropical solar longitude',years},null,2)+'\n');
console.log('Solar seasons 2026–2030: 60 verified intervals.');
