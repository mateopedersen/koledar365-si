import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {calendarICS} from '../../public/garden/calendar-tools.mjs';
import {paymentEvents} from '../../public/payments/experience.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),directory=path.join(root,'public/payments');
const data=JSON.parse(fs.readFileSync(path.join(directory,'data.json'),'utf8'));
const selections=Object.entries(data.categories).map(([id,category])=>[id,category.label,data.events.filter(event=>event.category===id)]);
selections.push(['socialni-transferji','Socialni transferji',data.events.filter(event=>event.source_id==='csd')]);
for(const [id,name,events] of selections){fs.writeFileSync(path.join(directory,`${id}-2026.ics`),calendarICS(paymentEvents(events,data.categories,data.sources),`${name} 2026 · Koledar365`));}
console.log(JSON.stringify({calendars:selections.length,events:data.events.length}));
