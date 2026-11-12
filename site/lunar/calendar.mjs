const root=document.querySelector('[data-lunar]');
if(root){
 const months=['januar','februar','marec','april','maj','junij','julij','avgust','september','oktober','november','december'];
 const gen=['januarja','februarja','marca','aprila','maja','junija','julija','avgusta','septembra','oktobra','novembra','decembra'];
 const label=d=>{const [y,m,day]=d.split('-').map(Number);return `${day}. ${gen[m-1]} ${y}`};
 const percent=d=>new Intl.NumberFormat('sl-SI',{minimumFractionDigits:1,maximumFractionDigits:1}).format(d.illuminationFraction*100)+'\u00a0%';
 const moon=(svg,date,alt,full=false)=>{const i=Number(date.slice(-2))-1,size=full?768:384;svg.setAttribute('viewBox',`${i%6*size} ${Math.floor(i/6)*size} ${size} ${size}`);const image=svg.querySelector('image');image.setAttribute('width',6*size);image.setAttribute('height',6*size);image.setAttribute('href',`/lunar/atlas/${date.slice(0,7)}-${full?'1':'screen'}.webp`);svg.setAttribute('aria-label',alt)};
 const event=e=>`${e.phaseNameSl} · ${label(e.localDate)} ob ${e.localTime.replace(':','.')} (UTC${e.localDateTime.slice(-6)})`;
 root.querySelector('.lunar-print')?.addEventListener('click',()=>window.print());
 root.querySelector('#lunar-phase-filter')?.addEventListener('change',e=>root.querySelectorAll('[data-phase]').forEach(r=>{r.hidden=e.target.value!=='all'&&r.dataset.phase!==e.target.value}));
 const year=Number(root.dataset.year),month=Number(root.dataset.month);
 if(month){
  const error=root.querySelector('[data-lunar-error]'),input=root.querySelector('#lunar-date'),buttons=[...root.querySelectorAll('.lunar-day')];
  const text=(name,value)=>{root.querySelector(`[data-detail-${name}]`).textContent=value};
  let data,current,loading;
  let requestId=0;
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
  function loadMonth() {
   if (!loading) {
    loading = fetch(`/lunar/data/${year}-${String(month).padStart(2, '0')}.json`)
     .then(response => {
      if (!response.ok) throw Error(response.status);
      return response.json();
     })
     .then(payload => { data = payload; return true; })
     .catch(() => {
      loading = null;
      error.textContent = 'Dnevnih podrobnosti ni bilo mogoče naložiti. Poskusite znova z izbiro datuma.';
      return false;
     });
   }
   return loading;
  }
  async function applyLatest(update) {
   const id = ++requestId;
   if ((data || await loadMonth()) && id === requestId) update();
  }
  const selectDay = (date, options) => applyLatest(() => select(date, options));
  const selectFromUrl = () => applyLatest(() => {
   if (!current) select(data.days[0].date);
   fromUrl();
  });
  buttons.forEach((button, index) => {
   button.addEventListener('click', () => selectDay(button.dataset.date, {push:true}));
   button.addEventListener('keydown', event => {
    const target = {ArrowLeft:index-1, ArrowRight:index+1, ArrowUp:index-7, ArrowDown:index+7, Home:0, End:buttons.length-1}[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = buttons[Math.max(0, Math.min(buttons.length - 1, target))];
    selectDay(next.dataset.date, {push:true, focus:true});
   });
  });
  input.addEventListener('change', () => {
   const date = input.value;
   if (!/^20(?:27|28|29|30)-\d{2}-\d{2}$/.test(date) || !input.checkValidity()) {
    error.textContent = 'Izberite veljaven datum med 1. januarjem 2027 in 31. decembrom 2030.';
    return;
   }
   const [selectedYear, selectedMonth] = date.split('-').map(Number);
   if (selectedYear !== year || selectedMonth !== month) {
    location.href = `/lunin-koledar/${selectedYear}/${months[selectedMonth-1]}/#dan-${date}`;
   } else {
    selectDay(date, {push:true});
   }
  });
  addEventListener('popstate', selectFromUrl);
  addEventListener('hashchange', selectFromUrl);
  const dialog = root.querySelector('dialog');
  const enlarge = root.querySelector('.lunar-enlarge');
  enlarge.addEventListener('click', async () => {
   if (!data && !await loadMonth()) return;
   if (!current) select(data.days[0].date);
   if (!current || dialog.open) return;
   moon(dialog.querySelector('svg'), current.date, `Luna ${label(current.date)}, ${percent(current)}.`, true);
   dialog.querySelector('[data-dialog-caption]').textContent = `${label(current.date)} · ${percent(current)} · ob 12.00 v Sloveniji`;
   dialog.showModal();
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => enlarge.focus({preventScroll:true}));
  selectFromUrl();
 }
}
