// All-day civil dates use UTC arithmetic; the countdown uses Ljubljana's calendar day.
export const dayValue = iso => Date.parse(iso + 'T12:00:00Z');
export const isoDay = date => date.toISOString().slice(0, 10);
export const addDays = (iso, count) => isoDay(new Date(dayValue(iso) + count * 86400000));
export const daysInclusive = (start, end) => Math.round((dayValue(end) - dayValue(start)) / 86400000) + 1;
export const validDate = iso => /^\d{4}-\d{2}-\d{2}$/.test(iso || '') && Number.isFinite(dayValue(iso)) && isoDay(new Date(dayValue(iso))) === iso;
export function schoolBreaks(data, level, region) {
  return data.breaks.filter(row => !row.region || row.region === region).map(row => ({...row, start: level === 'secondary' && row.secondary ? row.secondary[0] : row.start, end: level === 'secondary' && row.secondary ? row.secondary[1] : row.end}));
}
export function countSchoolDays(data, level, region, from, to) {
  if (!validDate(from) || !validDate(to) || from > to || from < '2026-09-01' || to > '2027-08-31') throw new Error('Izberite veljavno obdobje med 1. 9. 2026 in 31. 8. 2027. Končni datum naj bo za začetnim.');
  const breaks = schoolBreaks(data, level, region);
  let free = 0, total = daysInclusive(from, to);
  for (let day = from; day <= to; day = addDays(day, 1)) {
    const weekday = new Date(dayValue(day)).getUTCDay();
    if (weekday === 0 || weekday === 6 || data.publicHolidays.includes(day) || data.freeDays.includes(day) || breaks.some(row => day >= row.start && day <= row.end)) free++;
  }
  return {free, teaching: total - free, total};
}
const icsEscape = text => String(text).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function foldLine(text) {
  const encoder = new TextEncoder(); let result = '', current = '', length = 0;
  for (const char of text) {const size = encoder.encode(char).length; if (length + size > 75) {result += current + '\r\n'; current = ' '; length = 1;} current += char; length += size;}
  return result + current;
}
export function buildICS(events, scope, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Koledar365//Solski in studijski koledar//SL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Koledar365 · ' + icsEscape(scope)];
  for (const row of events) {
    if (!validDate(row.start) || !validDate(row.end) || row.start > row.end) throw new Error('Neveljaven datum izvoza.');
    lines.push('BEGIN:VEVENT', 'UID:' + icsEscape((row.uid || scope.replace(/[^a-zA-Z0-9]/g, '-') + '-' + row.id) + '@koledar365.si'), 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + row.start.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDays(row.end, 1).replace(/-/g, ''), 'SUMMARY:' + icsEscape(row.name), 'DESCRIPTION:' + icsEscape(row.description || 'Uradni termini 2026/2027. Enkraten uvoz; za spremembe preverite vir in obvestila ustanove.'), 'URL:' + row.url, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  return lines.concat('END:VCALENDAR', '').map(foldLine).join('\r\n');
}
export function ljubljanaToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {timeZone:'Europe/Ljubljana', year:'numeric', month:'2-digit', day:'2-digit'}).formatToParts(now);
  const part = type => parts.find(row => row.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
const dateText = iso => new Intl.DateTimeFormat('sl-SI', {timeZone:'UTC', day:'numeric', month:'numeric', year:'numeric'}).format(new Date(dayValue(iso)));
const longDate = iso => new Intl.DateTimeFormat('sl-SI', {timeZone:'UTC', day:'numeric', month:'long', year:'numeric'}).format(new Date(dayValue(iso)));
const rangeText = row => `${dateText(row.start)} – ${dateText(row.end)}`;
const escapeHTML = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = name => `<svg class="sp-icon" aria-hidden="true"><use href="#sp-${name}"/></svg>`;
function initSchoolPage(root) {
  if (root.dataset.held === 'true') return;
  const data = JSON.parse(root.querySelector('#sp-data').textContent);
  const $ = selector => root.querySelector(selector), $$ = selector => [...root.querySelectorAll(selector)];
  const params = new URLSearchParams(location.search);
  let level = ['primary','secondary','university'].includes(params.get('level')) ? params.get('level') : 'primary';
  let region = params.get('region') === 'east' ? 'east' : 'west';
  let university = data.universities.some(row => row.id === params.get('university')) ? params.get('university') : 'all';
  const selectedFaculties = Object.fromEntries(data.universities.filter(uni=>uni.calendars).map(uni=>[uni.id,uni.calendars[0].id]));
  let savedOnly = false, today = ljubljanaToday(), month = (today < '2026-09-01' ? '2026-09' : today > '2027-08-31' ? '2027-08' : today.slice(0,7));
  let favorites = new Set();
  try {const stored = JSON.parse(localStorage.getItem('koledar365-school-favorites') || '[]'); if (Array.isArray(stored)) favorites = new Set(stored.filter(id => data.breaks.some(row => row.id === id)));} catch { /* Storage may be unavailable; the page still works. */ }
  const tip = $('.sp-tip').outerHTML;
  let toastTimer;
  function toast(message) { const output = $('[data-school-toast]'); output.textContent = message; output.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => output.hidden = true, 4200); }
  function updateURL() {const url = new URL(location.href); url.searchParams.set('level', level); url.searchParams.set('region', region); if (university !== 'all') url.searchParams.set('university', university); else url.searchParams.delete('university'); history.replaceState(null, '', url.pathname + url.search + url.hash);}
  function activeBreaks() {return schoolBreaks(data, level, region);}
  function download(events, scope) {
    if (!events.length) return toast('Za to izbiro ni preverjenih datumov za izvoz.');
    const contents = buildICS(events, scope), url = URL.createObjectURL(new Blob([contents], {type:'text/calendar;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'koledar365-' + scope.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase() + '.ics'; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 15000);
    toast('Datoteka ICS je pripravljena za uvoz v vaš koledar.');
  }
  function selectedCalendar(uni) {return uni.calendars?.find(calendar=>calendar.id===selectedFaculties[uni.id]);}
  function universityEvents(uni) {
    const calendar=selectedCalendar(uni), periods=calendar?calendar.periods:uni.periods;
    return periods.map((row,index)=>({id:uni.id+'-'+(calendar?calendar.id+'-':'')+index,uid:'academic-2026-2027-'+uni.id+'-'+(calendar?calendar.id+'-':'')+index,name:uni.short+(calendar?' · '+calendar.id.toUpperCase():'')+' · '+row[0],start:row[1],end:row[2],kind:row[3],url:calendar?calendar.url:uni.url,description:(calendar?calendar.name+'. '+calendar.note+' ':'')+uni.scopeNote+(row[3]==='exam'?' Izpitno obdobje ni počitniško obdobje.':'')}));
  }
  function matchingUniversities() {
    const query=$('[data-university-search]').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    return data.universities.filter(uni=>(university==='all'||uni.id===university)&&(!query||(uni.name+' '+uni.short+' '+uni.city).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(query))&&(!$('[data-verified-only]').checked||uni.status!=='unverified'));
  }
  function renderUniversities() {
    const matches=matchingUniversities();
    $$('[data-university]').forEach(card=>card.hidden=!matches.some(uni=>uni.id===card.dataset.university));
    $('[data-university-count]').textContent='Prikazano: '+matches.length+' / '+data.universities.length;
    $('[data-university-empty]').hidden=matches.length>0;
    for(const uni of data.universities.filter(uni=>uni.calendars)) {
      const calendar=selectedCalendar(uni);
      $(`[data-periods-for="${uni.id}"]`).innerHTML=calendar.periods.map(row=>`<div><span class="sp-period-type sp-type-${row[3]}"><i></i>${escapeHTML(row[0])}</span><strong>${rangeText({start:row[1],end:row[2]})}</strong></div>`).join('');
      $(`[data-calendar-source="${uni.id}"]`).href=calendar.url;
    }
  }
  function exportAll() {
    if (level === 'university') {const universities = matchingUniversities(); return download(universities.flatMap(universityEvents), 'Univerze-2026-2027-' + university);}
    const rows = activeBreaks().map(row => ({...row, uid:'school-2026-2027-'+level+'-'+region+'-'+row.id, url:data.sources[level]}));
    rows.push(...data.freeDays.map(day => ({id:'free-' + day, name:'Pouka prost dan', start:day, end:day, url:data.sources[level]})));
    download(rows, 'Sola-2026-2027-' + level + '-' + region);
  }
  function renderCards() {
    const cards = activeBreaks().filter(row => !savedOnly || favorites.has(row.id));
    $('[data-holiday-grid]').innerHTML = cards.map(row => {
      const photo = data.photos?.[row.photo];
      const image = photo ? `<img src="${escapeHTML(photo.display_path || photo.path)}" srcset="${escapeHTML(photo.srcset || '')}" sizes="(max-width:600px) 50vw, (max-width:1000px) 45vw, 320px" width="${photo.width || 640}" height="${photo.height || 420}" alt="${escapeHTML(photo.alt)}" loading="lazy" decoding="async">` : '';
      const credit = photo ? `<div class="sp-photo-credit"><a href="${escapeHTML(photo.source)}" target="_blank" rel="noopener noreferrer" title="${escapeHTML(photo.title)}">Foto: ${escapeHTML(photo.author)}</a><span aria-hidden="true"> · </span>${photo.licenseUrl ? `<a href="${escapeHTML(photo.licenseUrl)}" target="_blank" rel="license noopener noreferrer">${escapeHTML(photo.license)}</a>` : `<span>${escapeHTML(photo.license)}</span>`}</div>` : '';
      return `<article id="pocitnice-${row.id}" class="sp-holiday sp-${row.season}" data-break-id="${row.id}"><div class="sp-card-art">${image}<span class="sp-season-tag">${{autumn:'JESEN',festive:'PRAZNIČNI ČAS',winter:'ZIMA',spring:'POMLAD',summer:'POLETJE'}[row.season]}</span><button type="button" class="sp-favorite" data-favorite="${row.id}" aria-label="${favorites.has(row.id)?'Odstrani iz shranjenih':'Shrani'}: ${escapeHTML(row.name)}" aria-pressed="${favorites.has(row.id)}">${icon('heart')}</button>${credit}</div><div class="sp-card-content"><small>${escapeHTML(row.tag)}</small><h3>${escapeHTML(row.name)}</h3><div class="sp-card-date">${icon('calendar')}<time datetime="${row.start}">${rangeText(row)}</time></div><div class="sp-card-bottom"><span><strong>${daysInclusive(row.start,row.end)}</strong> koledarskih dni <small>uradnega obdobja</small></span><button type="button" data-export-break="${row.id}" aria-label="Izvozi: ${escapeHTML(row.name)}">${icon('download')}</button></div></div></article>`;
    }).join('') + (!savedOnly ? tip : '');
    $('[data-empty]').hidden = !savedOnly || cards.length > 0;
    $('[data-saved-only]').setAttribute('aria-pressed', String(savedOnly)); $('[data-saved-count]').textContent = favorites.size;
  }
  function renderCountdown() {
    let upcoming;
    if (level === 'university') {
      const matches = data.universities.filter(row => university === 'all' || row.id === university);
      const rows = matches.flatMap(universityEvents).filter(row=>row.kind==='exam'||row.kind==='break');
      upcoming = rows.filter(row => row.end >= today).sort((a,b)=>a.start.localeCompare(b.start))[0];
      $('[data-countdown-label]').textContent = 'Naslednje izpitno ali prosto obdobje';
    } else {upcoming = activeBreaks().find(row => row.end >= today); $('[data-countdown-label]').textContent = 'Naslednje šolske počitnice';}
    $('[data-next-name]').textContent = upcoming ? upcoming.name : level === 'university' ? 'Brez potrjenih prihodnjih terminov' : 'Preverite koledar naslednjega leta';
    $('[data-next-date]').textContent = upcoming ? rangeText(upcoming) : 'Datumi še niso preverjeni';
    $('[data-countdown]').textContent = upcoming ? Math.max(0, daysInclusive(today,upcoming.start)-1) : '—';
    $('[data-countdown-unit]').textContent = !upcoming ? 'brez napovedi' : upcoming.start <= today ? 'obdobje že poteka' : level === 'university' ? 'dni do začetka' : 'dni do oddiha';
  }
  function calendarEvents() {return activeBreaks().concat(data.freeDays.map(day => ({name:'Pouka prost dan', start:day, end:day, freeDay:true})));}
  function renderCalendar() {
    const [year, number] = month.split('-').map(Number), first = new Date(Date.UTC(year,number-1,1,12)), count = new Date(Date.UTC(year,number,0,12)).getUTCDate(), offset = (first.getUTCDay()+6)%7;
    $('[data-month-title]').textContent = new Intl.DateTimeFormat('sl-SI',{timeZone:'UTC',month:'long',year:'numeric'}).format(first);
    const events = calendarEvents();
    $('[data-calendar]').innerHTML = ['PON','TOR','SRE','ČET','PET','SOB','NED'].map(day=>`<span class="sp-weekday">${day}</span>`).join('') + '<span aria-hidden="true"></span>'.repeat(offset) + Array.from({length:count},(_,index)=>{
      const day = `${month}-${String(index+1).padStart(2,'0')}`, weekday = new Date(dayValue(day)).getUTCDay(), current = events.filter(row=>day>=row.start&&day<=row.end), holiday = data.publicHolidays.includes(day);
      const label = longDate(day) + (current.length ? ' · ' + current.map(row=>row.name).join(', ') : '') + (holiday?' · praznik':'');
      return `<button type="button" class="sp-day${weekday===0||weekday===6?' sp-day-weekend':''}${current.some(row=>!row.freeDay)?' sp-day-break':''}${current.some(row=>row.freeDay)?' sp-day-free':''}${holiday?' sp-day-holiday':''}" data-calendar-day="${day}" aria-label="${escapeHTML(label)}" aria-pressed="false"${day===today?' aria-current="date"':''}>${index+1}</button>`;
    }).join('');
    const monthEvents = events.filter(row=>row.start.slice(0,7)<=month&&row.end.slice(0,7)>=month);
    $('[data-month-events]').innerHTML = monthEvents.length ? monthEvents.map(row=>`<div class="sp-month-event"><strong>${escapeHTML(row.name)}</strong><span>${rangeText(row)}</span></div>`).join('') : '<p class="sp-small">V tem mesecu ni šolskih počitnic za izbrano skupino.</p>';
    const holidays = data.publicHolidays.filter(day=>day.startsWith(month));
    if (holidays.length) $('[data-month-events]').insertAdjacentHTML('beforeend',`<div class="sp-month-event"><strong>Prazniki</strong><span>${holidays.map(dateText).join(' · ')}</span></div>`);
    $('[data-prev-month]').disabled = month === '2026-09'; $('[data-next-month]').disabled = month === '2027-08';
    $('[data-selected-date]').textContent = 'Izberite dan v koledarju.';
    $('[data-selected-date]').classList.remove('is-selected');
  }
  function calculate() {const form=$('[data-planner]'); try {const result = countSchoolDays(data, level === 'secondary' ? level : 'primary',region,form.elements.from.value,form.elements.to.value); $('[data-planner-result]').innerHTML = `<strong>${result.free}</strong> od ${result.total} dni brez rednega pouka. <span>Preostali dnevi: ${result.teaching}.</span>`;} catch(error) {$('[data-planner-result]').textContent = error.message;}}
  function renderState() {
    $$('[data-level]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.level===level)));
    $$('[data-school-only]').forEach(element=>element.hidden=level==='university');
    $('[data-region-select]').value=region; $('[data-region-select]').disabled=level==='university'; $('[data-university-select]').value=university;
    $$('[data-region-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.regionChoice===region)));
    renderUniversities();
    $('#sp-explorer-title').textContent = level === 'university' ? 'Poiščite svoj študijski koledar.' : 'Kdaj odložimo šolske torbe?';
    renderCards(); renderCalendar(); renderCountdown(); calculate();
  }
  root.addEventListener('click', event=>{
    const shortcut=event.target.closest('.period-links a[href^="#"]');
    if(shortcut&&root.contains(shortcut)){if(level==='university')level='primary';savedOnly=false;renderState();updateURL();}

    const target = event.target.closest('button'); if (!target || !root.contains(target)) return;
    if (target.hasAttribute('data-level')) {level=target.dataset.level;renderState();updateURL();}
    else if (target.hasAttribute('data-region-choice')) {region=target.dataset.regionChoice;renderState();updateURL();toast('Prikazana je ' + (region==='east'?'vzhodna':'zahodna') + ' skupina.');}
    else if (target.hasAttribute('data-saved-only')) {savedOnly=!savedOnly;renderCards();}
    else if (target.hasAttribute('data-favorite')) {const id=target.dataset.favorite;if(favorites.has(id))favorites.delete(id);else favorites.add(id);let persisted=true;try {localStorage.setItem('koledar365-school-favorites',JSON.stringify([...favorites]));}catch {persisted=false;}renderCards();const replacement=$(`[data-favorite="${id}"]`);if(replacement)replacement.focus({preventScroll:true});else $('[data-saved-only]').focus({preventScroll:true});toast(persisted?'Shranjene počitnice so posodobljene.':'Izbira velja do zaprtja strani; brskalnik ne dovoli shranjevanja.');}
    else if(target.hasAttribute('data-export-all')) exportAll();
    else if(target.hasAttribute('data-export-break')) {const row=activeBreaks().find(row=>row.id===target.dataset.exportBreak);if(row)download([{...row,uid:'school-2026-2027-'+level+'-'+region+'-'+row.id,url:data.sources[level]}],'Sola-2026-2027-'+level+'-'+region+'-'+row.id);}
    else if(target.hasAttribute('data-export-university')) {const uni=data.universities.find(row=>row.id===target.dataset.exportUniversity);if(uni)download(universityEvents(uni),'Studij-2026-2027-'+uni.id);}
    else if(target.hasAttribute('data-prev-month')||target.hasAttribute('data-next-month')) {const [year,num]=month.split('-').map(Number),next=new Date(Date.UTC(year,num-1+(target.hasAttribute('data-prev-month')?-1:1),1,12));const nextMonth=isoDay(next).slice(0,7);if(nextMonth>='2026-09'&&nextMonth<='2027-08')month=nextMonth;renderCalendar();}
    else if(target.hasAttribute('data-this-month')) {month=today<'2026-09-01'?'2026-09':today>'2027-08-31'?'2027-08':today.slice(0,7);renderCalendar();if(today<'2026-09-01'||today>'2027-08-31')toast('Današnji dan je zunaj preverjenega šolskega leta.');}
    else if(target.hasAttribute('data-calendar-day')) {$$('[data-calendar-day]').forEach(button=>button.setAttribute('aria-pressed',String(button===target)));const day=target.dataset.calendarDay,events=calendarEvents().filter(row=>day>=row.start&&day<=row.end);const weekday=new Date(dayValue(day)).getUTCDay();$('[data-selected-date]').textContent=longDate(day)+' · '+(events.length?events.map(row=>row.name).join(', '):data.publicHolidays.includes(day)?'Praznik':weekday===0||weekday===6?'Vikend':'Dan rednega pouka (splošni koledar)');$('[data-selected-date]').classList.add('is-selected');}
    else if(target.hasAttribute('data-school-calendar-print')) {document.body.classList.add('school-calendar-printing');window.addEventListener('afterprint',()=>document.body.classList.remove('school-calendar-printing'),{once:true});window.print();}
    else if(target.hasAttribute('data-print')) window.print();
  });
  $('[data-region-select]').addEventListener('change',event=>{region=event.target.value;renderState();updateURL();});
  $('[data-university-select]').addEventListener('change',event=>{university=event.target.value;renderState();updateURL();});
  $('[data-university-search]').addEventListener('input',renderUniversities);
  $('[data-verified-only]').addEventListener('change',renderUniversities);
  $$('[data-faculty-select]').forEach(select=>select.addEventListener('change',event=>{selectedFaculties[select.dataset.facultySelect]=event.target.value;renderUniversities();renderCountdown();}));
  $('[data-year-select]').addEventListener('change',event=>{const year=Number(event.target.value);if(year!==2026)location.assign(`/solske-pocitnice/${year}-${year+1}/`);});
  $('[data-planner]').addEventListener('submit',event=>{event.preventDefault();calculate();});
  const refreshDay=()=>{const current=ljubljanaToday();if(current!==today){today=current;renderCountdown();renderCalendar();}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshDay();}); setInterval(refreshDay,60000);
  renderState();
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-school-page]').forEach(initSchoolPage);
