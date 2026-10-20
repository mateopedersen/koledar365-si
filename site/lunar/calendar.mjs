const root=document.querySelector('[data-lunar]');
if(root){
 const months=['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
 const gen=['januarja','februarja','marca','aprila','maja','junija','julija','avgusta','septembra','oktobra','novembra','decembra'];
 const label=d=>{const [y,m,day]=d.split('-').map(Number);return `${day}. ${gen[m-1]} ${y}`};
 const percent=d=>new Intl.NumberFormat('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1}).format(d.illuminationFraction*100)+'\u00a0%';
 const moon=(svg,date,alt)=>{const i=(Number(date.slice(-2))-1)%7;svg.setAttribute('viewBox',`${i%3*768} ${Math.floor(i/3)*768} 768 768`);svg.querySelector('image').setAttribute('href',`/lunar/atlas/${date.slice(0,7)}-${Math.floor((Number(date.slice(-2))-1)/7)+1}.webp`);svg.setAttribute('aria-label',alt)};
 const event=e=>`${e.phaseNameSl} · ${label(e.localDate)} ob ${e.localTime.replace(':','.')} (UTC${e.localDateTime.slice(-6)})`;
 root.querySelector('.lunar-print')?.addEventListener('click',()=>window.print());
 root.querySelector('#lunar-phase-filter')?.addEventListener('change',e=>root.querySelectorAll('[data-phase]').forEach(r=>{r.hidden=e.target.value!=='all'&&r.dataset.phase!==e.target.value}));
 const year=Number(root.dataset.year),month=Number(root.dataset.month);
 if(month){
  const error=root.querySelector('[data-lunar-error]'),input=root.querySelector('#lunar-date'),buttons=[...root.querySelectorAll('.lunar-day')];
  const text=(name,value)=>{root.querySelector(`[data-detail-${name}]`).textContent=value};
  let data,current;
  function select(date,{push=false,focus=false}={}){
   const d=data.days.find(d=>d.date===date);
   if(!d){error.textContent='Izberite veljaven datum prikazanega meseca.';return false}
   error.textContent='';current=d;input.value=d.date;
   buttons.forEach(b=>{const on=b.dataset.date===date;b.setAttribute('aria-pressed',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus()});
   text('date',label(date));text('percent',percent(d));text('direction',d.phaseNameSl);text('time',`Ob 12.00 (UTC${d.localNoon.slice(-6)})`);
   const im=root.querySelector('[data-detail-image]');moon(im,date,`Luna ${label(date)} ob 12.00; osvetljenost ${percent(d)}.`);
   text('events',data.events.filter(e=>e.localDate===date).map(event).join('; ')||'Na ta dan ni glavne lunine mene.');
   text('next',data.nextEvents[date]?event(data.nextEvents[date]):'Podatek ni na voljo.');
   root.querySelector('[data-lunar-live]').textContent=`${label(date)}, ${percent(d)}, ${d.phaseNameSl}`;
   if(push)history.pushState(null,'',`#dan-${date}`);
   return true;
  }
  function fromUrl(){
   if(location.hash){const m=/^#dan-(\d{4}-\d{2}-\d{2})$/.exec(location.hash);if(m){select(m[1]);return}if(location.hash.startsWith('#dan-'))error.textContent='Povezava vsebuje neveljaven datum. Izberite datum v koledarju.';return}
   const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Ljubljana',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());select(data.days.some(d=>d.date===today)?today:data.days[0].date);
  }
  fetch(`/lunar/data/${year}-${String(month).padStart(2,'0')}.json`).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(d=>{
   data=d;select(d.days[0].date);fromUrl();
   buttons.forEach((b,i)=>{b.addEventListener('click',()=>select(b.dataset.date,{push:true}));b.addEventListener('keydown',e=>{
    const target={ArrowLeft:i-1,ArrowRight:i+1,ArrowUp:i-7,ArrowDown:i+7,Home:0,End:buttons.length-1}[e.key];if(target===undefined)return;e.preventDefault();const n=Math.max(0,Math.min(buttons.length-1,target));select(buttons[n].dataset.date,{push:true,focus:true});
   })});
   input.addEventListener('change',()=>{const v=input.value;if(!/^20(?:27|28|29|30)-\d{2}-\d{2}$/.test(v)||!input.checkValidity()){error.textContent='Izberite veljaven datum med 1. januarjem 2027 in 31. decembrom 2030.';return}const [y,m]=v.split('-').map(Number);if(y!==year||m!==month)location.href=`/lunin-koledar/${y}/${months[m-1]}/#dan-${v}`;else select(v,{push:true})});
   addEventListener('popstate',fromUrl);addEventListener('hashchange',fromUrl);
   const dialog=root.querySelector('dialog');root.querySelector('.lunar-enlarge').addEventListener('click',()=>{moon(dialog.querySelector('svg'),current.date,`Luna ${label(current.date)}, ${percent(current)}.`);dialog.querySelector('[data-dialog-caption]').textContent=`${label(current.date)} · ${percent(current)} · ob 12.00 v Sloveniji`;dialog.showModal()});dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  }).catch(()=>{error.textContent='Dnevnih podrobnosti ni bilo mogoče naložiti. Koledar in preglednica men ostajata na voljo.'});
 }
}
