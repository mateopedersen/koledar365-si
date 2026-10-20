// Calendar Studio: UTC calendar arithmetic and a shared SVG source for preview/export.
export const VERSION = 1;
export const FONTS = {
  sans: {label:'Sodobna · Arial', family:'Arial, Helvetica, sans-serif'},
  editorial: {label:'Uredniška · Georgia', family:'Georgia, Times New Roman, serif'},
  classic: {label:'Klasična · Times', family:'Times New Roman, Times, serif'},
  rounded: {label:'Prijazna · Trebuchet', family:'Trebuchet MS, Arial, sans-serif'},
  clean: {label:'Čista · Verdana', family:'Verdana, Arial, sans-serif'},
  mono: {label:'Tehnična · Courier', family:'Courier New, Courier, monospace'}
};
export const PRESETS = [
  {id:'slovenia',label:'Slovenija',note:'Bela, modra in rdeča',colors:{accent:'#0054b8',ink:'#172941',paper:'#ffffff',weekend:'#cf2439',grid:'#dce3eb'},font:'sans'},
  {id:'editorial',label:'Uredniška',note:'Velika letnica, miren ritem',colors:{accent:'#172941',ink:'#172941',paper:'#fffdf9',weekend:'#bd293e',grid:'#dfded9'},font:'editorial'},
  {id:'photo',label:'Fotografska',note:'Vaša fotografija v ospredju',colors:{accent:'#0054b8',ink:'#172941',paper:'#ffffff',weekend:'#cf2439',grid:'#dce3eb'},font:'sans'},
  {id:'minimal',label:'Minimalna',note:'Čisto in brez odvečnega',colors:{accent:'#334155',ink:'#1e293b',paper:'#ffffff',weekend:'#b91c3c',grid:'#e2e8f0'},font:'clean'},
  {id:'business',label:'Poslovna',note:'Ime podjetja in jasna mreža',colors:{accent:'#004b9b',ink:'#152c46',paper:'#ffffff',weekend:'#bf2c3d',grid:'#cbd6e2'},font:'sans'},
  {id:'bold',label:'Izrazita',note:'Močan naslov in barvni poudarki',colors:{accent:'#cf2439',ink:'#152941',paper:'#ffffff',weekend:'#0054b8',grid:'#dce3eb'},font:'rounded'}
];
export const LOCALES = {
  sl:{months:['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'],days:['NED','PON','TOR','SRE','ČET','PET','SOB'],week:'T',notes:'ZAPISKI',events:'MOJI DOGODKI',more:'več'},
  en:{months:['January','February','March','April','May','June','July','August','September','October','November','December'],days:['SUN','MON','TUE','WED','THU','FRI','SAT'],week:'W',notes:'NOTES',events:'MY EVENTS',more:'more'}
};
export const PAPERS={a4:[210,297],a3:[297,420],letter:[215.9,279.4]};
export const uid=()=>globalThis.crypto?.randomUUID?.() || `k${Date.now().toString(36)}${Math.random().toString(36).slice(2,9)}`;
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export const clamp=(value,min,max,fallback=min)=>Number.isFinite(Number(value))?Math.min(max,Math.max(min,Number(value))):fallback;
export const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
export const clone=s=>({...s,colors:{...s.colors},events:s.events.map(e=>({...e})),layers:s.layers.map(l=>({...l}))});
export function initialState(year=new Date().getFullYear()+1){
  return {version:VERSION,year,month:1,view:'year',template:'slovenia',weekStart:1,locale:'sl',paper:'a4',orientation:'landscape',margin:12,
    title:'Moje leto',subtitle:'Prostor za vse, kar šteje.',name:'',footer:'Ustvarjeno z navdihom. Načrtovano po moje.',
    font:'sans',titleSize:40,textScale:1,titleAlign:'left',colors:{...PRESETS[0].colors},showHolidays:true,showHolidayNames:true,
    showWeekends:true,showWeekNumbers:false,showAdjacent:false,showGrid:true,showNotes:false,notes:'',includeAgenda:true,
    photo:'',photoRatio:1.5,photoPlacement:'banner',photoPosition:50,photoHeight:25,photoOpacity:18,photoFit:'cover',events:[],layers:[],quality:300};
}
export function validDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return false;
  const [y,m,d]=value.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
  return y>=1900&&y<=2100&&dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
}
const hex=(v,f)=>/^#[0-9a-f]{6}$/i.test(v)?v:f;
const text=(v,max)=>String(v??'').slice(0,max).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'');
const image=v=>typeof v==='string'&&v.length<=8000000&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v)?v:'';
export function normalize(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Datoteka ni projekt Koledar365.');
  if(input.version!==VERSION)throw Error('Ta različica projekta ni podprta.');
  const s=initialState();
  for(const k of ['year','month','margin','titleSize','textScale','photoPosition','photoHeight','photoOpacity','quality']){
    const bounds={year:[1900,2100],month:[1,12],margin:[6,25],titleSize:[20,76],textScale:[.8,1.3],photoPosition:[0,100],photoHeight:[15,40],photoOpacity:[0,65],quality:[150,300]}[k];
    s[k]=clamp(input[k]??s[k],...bounds,s[k]);
  }
  s.year=Math.round(s.year);s.month=Math.round(s.month);s.quality=s.quality>=225?300:150;
  const options={view:['year','month'],template:PRESETS.map(p=>p.id),weekStart:[0,1],locale:['sl','en'],paper:Object.keys(PAPERS),orientation:['landscape','portrait'],font:Object.keys(FONTS),titleAlign:['left','center','right'],photoPlacement:['banner','background'],photoFit:['cover','contain']};
  for(const [k,values] of Object.entries(options))if(values.includes(input[k]))s[k]=input[k];
  for(const k of ['showHolidays','showHolidayNames','showWeekends','showWeekNumbers','showAdjacent','showGrid','showNotes','includeAgenda'])if(typeof input[k]==='boolean')s[k]=input[k];
  for(const [k,n] of Object.entries({title:90,subtitle:180,name:100,footer:200,notes:300}))s[k]=text(input[k]??s[k],n);
  for(const k of Object.keys(s.colors))s.colors[k]=hex(input.colors?.[k],s.colors[k]);
  s.photo=image(input.photo);
  s.photoRatio=clamp(input.photoRatio,.05,20,1.5);
  s.events=(Array.isArray(input.events)?input.events:[]).slice(0,500).filter(e=>e&&validDate(e.date)&&String(e.title??'').trim()).map(e=>({id:uid(),date:e.date,title:text(e.title,120),color:hex(e.color,'#0054b8'),annual:e.annual===true}));
  s.layers=(Array.isArray(input.layers)?input.layers:[]).slice(0,16).filter(l=>l&&['text','image'].includes(l.type)).map(l=>({
    id:uid(),type:l.type,text:text(l.text,400),src:image(l.src),x:clamp(l.x,0,100,50),y:clamp(l.y,0,100,50),
    width:clamp(l.width,3,100,20),height:clamp(l.height,3,100,12),size:clamp(l.size,8,100,24),color:hex(l.color,s.colors.ink),
    font:FONTS[l.font]?l.font:s.font,align:['start','middle','end'].includes(l.align)?l.align:'start',bold:l.bold===true,italic:l.italic===true,
    rotation:clamp(l.rotation,-180,180,0),opacity:clamp(l.opacity,10,100,100)
  })).filter(l=>l.type==='text'||l.src);
  return s;
}
export function monthGrid(year,month,weekStart=1){
  const first=new Date(Date.UTC(year,month-1,1)),offset=(first.getUTCDay()-weekStart+7)%7;
  return Array.from({length:42},(_,i)=>{const dt=new Date(Date.UTC(year,month-1,1-offset+i));return {year:dt.getUTCFullYear(),month:dt.getUTCMonth()+1,day:dt.getUTCDate(),weekday:dt.getUTCDay(),date:iso(dt.getUTCFullYear(),dt.getUTCMonth()+1,dt.getUTCDate()),current:dt.getUTCMonth()===month-1};});
}
export function isoWeek(date){
  const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  return Math.ceil(((d-new Date(Date.UTC(d.getUTCFullYear(),0,1)))/86400000+1)/7);
}
export function holidays(year){
  // Same Gregorian Easter rule and work-free dates as CalendarEngine/source data.
  const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),v=h+l-7*m+114;
  const easter=new Date(Date.UTC(year,Math.floor(v/31)-1,v%31+1));
  const rows=[[1,1,'Novo leto'],[1,2,'Novo leto'],[2,8,'Prešernov dan'],[4,27,'Dan upora proti okupatorju'],[5,1,'Praznik dela'],[5,2,'Praznik dela'],[6,25,'Dan državnosti'],[8,15,'Marijino vnebovzetje'],[10,31,'Dan reformacije'],[11,1,'Dan spomina na mrtve'],[12,25,'Božič'],[12,26,'Dan samostojnosti in enotnosti']].map(([mo,day,title])=>({date:iso(year,mo,day),title,holiday:true}));
  for(const [offset,title] of [[0,'Velika noč'],[1,'Velikonočni ponedeljek'],[49,'Binkošti']]){const dt=new Date(easter);dt.setUTCDate(dt.getUTCDate()+offset);rows.push({date:dt.toISOString().slice(0,10),title,holiday:true});}
  return rows;
}
export function eventsFor(s,month=null,includeHolidays=true){
  const events=s.events.flatMap(e=>{const date=e.annual?`${s.year}${e.date.slice(4)}`:e.date;return validDate(date)&&Number(date.slice(0,4))===s.year?[{...e,date}]:[];});
  if(includeHolidays&&s.showHolidays)events.push(...holidays(s.year).map(e=>({...e,color:s.colors.weekend})));
  return events.filter(e=>!month||Number(e.date.slice(5,7))===month).sort((a,b)=>a.date.localeCompare(b.date)||a.title.localeCompare(b.title));
}
export function dimensions(s){const [a,b]=PAPERS[s.paper]||PAPERS.a4;const mm=s.orientation==='landscape'?[b,a]:[a,b];return {width:1000,height:1000*mm[1]/mm[0],mmWidth:mm[0],mmHeight:mm[1]};}
function mix(color,amount=.9){return '#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*(1-amount)+255*amount).toString(16).padStart(2,'0')).join('');}
function svgText(value,x,y,size,fill,font,extra=''){return `<text x="${x}" y="${y}" font-family="${esc(FONTS[font]?.family||FONTS.sans.family)}" font-size="${size}" fill="${fill}" ${extra}>${esc(value)}</text>`;}
function lines(value,max){const words=String(value).split(/\s+/),out=[];let line='';for(let word of words){if((line+' '+word).trim().length>max&&line){out.push(line);line='';}while(word.length>max){out.push(word.slice(0,max));word=word.slice(max);}line=(line+' '+word).trim();}if(line)out.push(line);return out;}
function shorten(value,max){return String(value).length>max?String(value).slice(0,max-1)+'…':value;}
export function renderCalendar(s,{month=s.month,editing=false,selected=null}={}){
  const {width:w,height:h,mmWidth}=dimensions(s),m=s.margin/mmWidth*w,c=s.colors,L=LOCALES[s.locale],scale=s.textScale;
  const isMonth=s.view==='month',hasBanner=!!s.photo&&s.photoPlacement==='banner',photoH=hasBanner?(isMonth?h*s.photoHeight/100:Math.min(165,h*.16)):0;
  const header=hasBanner&&isMonth?photoH+128:Math.max(125,h*.18),foot=h-m-16,notesH=s.showNotes?Math.min(100,h*.13):0;
  const art=[];
  art.push(`<rect width="${w}" height="${h}" fill="${c.paper}"/>`);
  if(s.photo&&s.photoPlacement==='background')art.push(`<image href="${s.photo}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" opacity="${s.photoOpacity/100}"/>`);
  if(hasBanner){const bw=isMonth?w-m*2:230,bx=isMonth?m:w-m-bw,bh=photoH,ratio=s.photoRatio||1.5;let iw=bw,ih=bh,ix=bx,iy=m;if(s.photoFit==='cover'){const factor=Math.max(bw/ratio,bh);iw=factor*ratio;ih=factor;ix=bx-(iw-bw)/2;iy=m-(ih-bh)*s.photoPosition/100;}const clipId=`studio-art-photo-clip-${month}`;art.push(`<defs><clipPath id="${clipId}"><rect x="${bx}" y="${m}" width="${bw}" height="${bh}" rx="3"/></clipPath></defs><image href="${s.photo}" x="${ix}" y="${iy}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`);}
  const titleY=hasBanner&&isMonth?m+photoH+53:m+54;
  const align=s.titleAlign==='center'?'middle':s.titleAlign==='right'?'end':'start',textEnd=hasBanner&&!isMonth?w-m-255:w-m,tx=align==='middle'?(m+textEnd)/2:align==='end'?textEnd:m;
  const heading=isMonth?`${L.months[month-1]} ${s.year}`:s.title||String(s.year);
  if(s.template==='bold')art.push(`<rect x="${m}" y="${titleY-47}" width="8" height="54" fill="${c.accent}"/>`);
  const titleAvailable=textEnd-m-(!isMonth&&!hasBanner&&align==='start'?170:0)-(s.template==='bold'?22:0),titleSize=Math.min(s.titleSize,titleAvailable/Math.max(1,heading.length*.58));
  art.push(svgText(heading,tx+(s.template==='bold'&&align==='start'?22:0),titleY,Math.max(13,titleSize),c.ink,s.font,`font-weight="700" text-anchor="${align}"`));
  const second=[s.name,isMonth?s.title:s.subtitle,!isMonth&&(hasBanner||align!=='start')?s.year:''].filter(Boolean).join(' · ');
  art.push(svgText(shorten(second,Math.floor((textEnd-m)/(6.5*scale))),tx,titleY+25,13*scale,c.ink,s.font,`text-anchor="${align}" opacity=".7"`));
  if(!isMonth&&align==='start'&&!hasBanner)art.push(svgText(s.year,w-m,titleY,s.template==='editorial'?75:52,c.accent,s.font,'text-anchor="end" font-weight="700"'));
  if(s.template!=='minimal')art.push(`<path d="M${m} ${titleY+45}H${w-m}" stroke="${c.grid}"/><path d="M${m} ${titleY+45}h${(w-2*m)/3}" stroke="${c.accent}" stroke-width="3"/><path d="M${m+(w-2*m)/3} ${titleY+45}h${(w-2*m)/6}" stroke="${c.weekend}" stroke-width="3"/>`);
  const top=Math.max(header,titleY+66),bottom=foot-28-notesH;
  const allEvents=eventsFor(s),eventMap=new Map();for(const e of allEvents){if(!eventMap.has(e.date))eventMap.set(e.date,[]);eventMap.get(e.date).push(e);}
  if(isMonth)art.push(drawMonth(month,m,top,w-2*m,bottom-top,true));
  else{const columns=s.orientation==='landscape'?4:3,rows=12/columns,gap=22,cw=(w-2*m-gap*(columns-1))/columns,ch=(bottom-top-gap*(rows-1))/rows;for(let mo=1;mo<=12;mo++){art.push(drawMonth(mo,m+((mo-1)%columns)*(cw+gap),top+Math.floor((mo-1)/columns)*(ch+gap),cw,ch,false));}}
  if(s.showNotes){const y=bottom+20;art.push(svgText(L.notes,m,y,9,c.accent,s.font,'font-weight="700" letter-spacing="1.5"'));lines(s.notes,120).slice(0,3).forEach((t,i)=>art.push(svgText(t,m,y+19+i*16,11,c.ink,s.font)));if(!s.notes)for(let i=1;i<=3;i++)art.push(`<path d="M${m} ${y+19+i*14}H${w-m}" stroke="${c.grid}"/>`);}
  art.push(`<path d="M${m} ${foot-8}H${w-m}" stroke="${c.grid}"/>`);
  art.push(svgText(shorten(s.footer,160),m,foot+8,9,c.ink,s.font,'opacity=".6"'));
  art.push(svgText('KOLEDAR365',w-m,foot+8,8,c.accent,'sans','text-anchor="end" letter-spacing="1.3"'));
  for(const layer of s.layers){const x=layer.x/100*w,y=layer.y/100*h,lw=layer.width/100*w,lh=layer.height/100*h;
    let content=layer.type==='image'?`<image href="${layer.src}" x="0" y="0" width="${lw}" height="${lh}" preserveAspectRatio="xMidYMid meet"/>`:layer.text.split('\n').map((t,i)=>svgText(t,0,i*layer.size*1.2,layer.size,layer.color,layer.font,`font-weight="${layer.bold?'700':'400'}" font-style="${layer.italic?'italic':'normal'}" text-anchor="${layer.align}"`)).join('');
    if(editing&&layer.id===selected){const estimate=layer.type==='image'?lw:Math.max(45,...layer.text.split('\n').map(t=>t.length*layer.size*.57)),eh=layer.type==='image'?lh:layer.size*1.2*layer.text.split('\n').length;const bx=layer.type==='text'&&layer.align==='middle'?-estimate/2:layer.type==='text'&&layer.align==='end'?-estimate:0;content+=`<rect x="${bx-7}" y="${layer.type==='image'?-7:-layer.size-4}" width="${estimate+14}" height="${eh+14}" fill="none" stroke="#0054b8" stroke-width="1.5" stroke-dasharray="5 3" pointer-events="none"/>`;}
    art.push(`<g ${editing?`data-layer="${esc(layer.id)}" tabindex="0" role="button" aria-label="${esc(layer.type==='image'?'Slika':layer.text)}" style="cursor:move"`:''} transform="translate(${x} ${y}) rotate(${layer.rotation})" opacity="${layer.opacity/100}">${content}</g>`);
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc((isMonth?L.months[month-1]+' ':'')+'Koledar '+s.year)}"><title>${esc(s.title||'Koledar')} ${s.year}</title>${art.join('')}</svg>`;
  function drawMonth(mo,x,y,cw,ch,large){
    const out=[],grid=monthGrid(s.year,mo,s.weekStart),weekW=s.showWeekNumbers?(large?24:16):0,cellW=(cw-weekW)/7;
    const rows=large?Math.ceil((grid.findIndex(day=>day.current)+new Date(Date.UTC(s.year,mo,0)).getUTCDate())/7):6;
    const labelH=large?0:27,dayH=large?27:17,rowH=(ch-labelH-dayH)/rows,base=y+labelH+dayH;
    if(!large)out.push(svgText(L.months[mo-1].toUpperCase(),x,y+15,14*scale,c.accent,s.font,'font-weight="700" letter-spacing=".8"'));
    if(s.showWeekNumbers)out.push(svgText(L.week,x+weekW/2,y+labelH+dayH*.67,large?10:7,c.ink,s.font,'text-anchor="middle" opacity=".45"'));
    for(let col=0;col<7;col++){const day=(col+s.weekStart)%7;out.push(svgText(L.days[day],x+weekW+cellW*(col+.5),y+labelH+dayH*.67,(large?12:7.5)*scale,s.showWeekends&&[0,6].includes(day)?c.weekend:c.ink,s.font,'font-weight="700" text-anchor="middle" opacity=".75"'));}
    for(let row=0;row<rows;row++){
      if(s.showWeekNumbers)out.push(svgText(isoWeek(grid[row*7+(s.weekStart===0?1:0)].date),x+weekW/2,base+row*rowH+(large?22:rowH*.65),large?10:7,c.ink,s.font,'text-anchor="middle" opacity=".4"'));
      for(let col=0;col<7;col++){
        const day=grid[row*7+col];if(!day.current&&!s.showAdjacent)continue;
        const dx=x+weekW+cellW*col,dy=base+row*rowH,list=day.current?(eventMap.get(day.date)||[]):[],holiday=list.some(e=>e.holiday),weekend=[0,6].includes(day.weekday),color=!day.current?mix(c.ink,.65):holiday?c.weekend:weekend&&s.showWeekends?c.weekend:c.ink;
        if(large&&s.showWeekends&&weekend)out.push(`<rect x="${dx}" y="${dy}" width="${cellW}" height="${rowH}" fill="${mix(c.weekend,.97)}"/>`);
        if(s.showGrid)out.push(`<path d="M${dx} ${dy}H${dx+cellW}" stroke="${c.grid}" stroke-width="${large?1:.65}"/>`);
        out.push(svgText(day.day,large?dx+9:dx+cellW/2,large?dy+Math.min(25,rowH*.62):dy+rowH*.62,Math.min((large?20:11.5)*scale,rowH*.78),color,s.font,`text-anchor="${large?'start':'middle'}" font-weight="${holiday?'700':'400'}"`));
        if(large){const visible=list.filter(e=>!e.holiday||s.showHolidayNames),cap=Math.max(0,Math.min(4,Math.floor((rowH-29)/16))),max=Math.max(9,Math.floor(cellW/(6*scale)));visible.slice(0,cap).forEach((e,i)=>{out.push(`<rect x="${dx+8}" y="${dy+28+i*16}" width="3" height="9" rx="1" fill="${e.color||c.accent}"/>`);out.push(svgText(shorten(e.title,max),dx+16,dy+36+i*16,9*scale,e.color||c.accent,s.font));});if(visible.length>cap&&cap>0)out.push(svgText(`+${visible.length-cap} ${L.more}`,dx+9,dy+rowH-4,8,c.ink,s.font,'opacity=".65"'));else if(visible.length&&cap===0)out.push(`<circle cx="${dx+cellW-12}" cy="${dy+Math.min(20,rowH*.5)}" r="3" fill="${visible[0].color||c.accent}"/>`);}
        else if(list.some(e=>!e.holiday)){out.push(`<circle cx="${dx+cellW*.76}" cy="${dy+rowH*.40}" r="2" fill="${list.find(e=>!e.holiday).color||c.accent}"/>`);}
      }
    }
    return out.join('');
  }
}
export function renderAgenda(s,entries,page=1){
  const {width:w,height:h,mmWidth}=dimensions(s),m=s.margin/mmWidth*w,L=LOCALES[s.locale],out=[`<rect width="${w}" height="${h}" fill="${s.colors.paper}"/>`];
  out.push(svgText(L.events,m,m+32,27,s.colors.ink,s.font,'font-weight="700"'),svgText(`${s.title||s.year} · ${s.year} · ${page}`,m,m+56,12,s.colors.accent,s.font));
  entries.forEach((e,i)=>{const y=m+95+i*43;out.push(`<path d="M${m} ${y+24}H${w-m}" stroke="${s.colors.grid}"/>`,svgText(e.date.split('-').reverse().join('.'),m,y,12,s.colors.ink,s.font));lines(e.title,Math.max(30,Math.floor((w-m*2-106)/7))).forEach((line,n)=>out.push(svgText(line,m+106,y+n*16,13,e.color||s.colors.accent,s.font)));});
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${out.join('')}</svg>`;
}
export function exportPages(s,scope='current'){
  const months=s.view==='month'&&scope==='all'?Array.from({length:12},(_,i)=>i+1):[s.month],pages=months.map(month=>renderCalendar(s,{month}));
  const events=eventsFor(s,s.view==='month'&&scope!=='all'?s.month:null,false);
  if(s.includeAgenda&&events.length){const {height,mmWidth}=dimensions(s),perPage=Math.max(5,Math.floor((height-s.margin/mmWidth*2000-110)/43));for(let i=0;i<events.length;i+=perPage)pages.push(renderAgenda(s,events.slice(i,i+perPage),i/perPage+1));}
  return pages;
}
export function parseEvents(source,kind='csv'){
  const out=[];
  if(kind==='ics'){
    const unfolded=source.replace(/\r?\n[ \t]/g,'');
    for(const block of unfolded.split('BEGIN:VEVENT').slice(1)){
      const date=block.match(/(?:^|\n)DTSTART(?:;[^:\n]*)?:(\d{8})/)?.[1],title=block.match(/(?:^|\n)SUMMARY(?:;[^:\n]*)?:(.*)/)?.[1];
      if(date&&title)out.push({date:`${date.slice(0,4)}-${date.slice(4,6)}-${date.slice(6,8)}`,title:title.replace(/\\n/gi,' ').replace(/\\([,;\\])/g,'$1'),annual:/RRULE:[^\n]*FREQ=YEARLY/.test(block),color:'#0054b8'});
    }
  }else{
    for(const line of source.split(/\r?\n/)){
      const cells=[];let value='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'&&line[i+1]==='"'&&quoted){value+='"';i++;}else if(c==='"')quoted=!quoted;else if((c===','||c===';')&&!quoted){cells.push(value);value='';}else value+=c;}cells.push(value);
      if(cells.length>=2)out.push({date:cells[0].trim(),title:cells[1].trim(),annual:/^(1|true|yes|da)$/i.test(cells[2]?.trim()||''),color:hex(cells[3]?.trim(),'#0054b8')});
    }
  }
  return out.filter(e=>validDate(e.date)&&e.title).slice(0,500).map(e=>({...e,id:uid(),title:text(e.title,120)}));
}
export function eventsICS(s){
  const escape=v=>String(v).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Koledar365//Calendar Studio//SL','CALSCALE:GREGORIAN'];
  const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  for(const e of s.events){lines.push('BEGIN:VEVENT',`UID:${e.id}@koledar365.si`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${e.date.replaceAll('-','')}`,`SUMMARY:${escape(e.title)}`,...(e.annual?['RRULE:FREQ=YEARLY']:[]),'END:VEVENT');}
  return [...lines,'END:VCALENDAR'].join('\r\n');
}
export function createPDF(images,mmWidth,mmHeight){
  // A deterministic multi-page PDF with 300/150 dpi JPEG pages, no remote service.
  const enc=new TextEncoder(),parts=[],offsets=[0];let length=0;const add=v=>{const b=typeof v==='string'?enc.encode(v):v;parts.push(b);length+=b.length;};
  add('%PDF-1.4\n');const count=images.length,info=3+count*3;
  const obj=(id,body)=>{offsets[id]=length;add(`${id} 0 obj\n`);if(Array.isArray(body))body.forEach(add);else add(body);add('\nendobj\n');};
  obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,`<< /Type /Pages /Count ${count} /Kids [${images.map((_,i)=>`${3+i*3} 0 R`).join(' ')}] >>`);
  const pw=mmWidth/25.4*72,ph=mmHeight/25.4*72;
  images.forEach((im,i)=>{const id=3+i*3,stream=`q\n${pw} 0 0 ${ph} 0 0 cm\n/Im0 Do\nQ\n`;obj(id,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${id+1} 0 R >> >> /Contents ${id+2} 0 R >>`);obj(id+1,[`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>\nstream\n`,im.bytes,'\nendstream']);obj(id+2,`<< /Length ${enc.encode(stream).length} >>\nstream\n${stream}endstream`);});
  obj(info,'<< /Producer (Koledar365 Calendar Studio) /Title (Custom calendar) >>');const xref=length;add(`xref\n0 ${info+1}\n0000000000 65535 f \n`);for(let i=1;i<=info;i++)add(`${String(offsets[i]).padStart(10,'0')} 00000 n \n`);add(`trailer\n<< /Size ${info+1} /Root 1 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF`);
  const result=new Uint8Array(length);let at=0;for(const part of parts){result.set(part,at);at+=part.length;}return result;
}
