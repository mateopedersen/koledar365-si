(() => {
  'use strict';
  const ZONE = 'Europe/Ljubljana';
  const months = ['januarja','februarja','marca','aprila','maja','junija','julija','avgusta','septembra','oktobra','novembra','decembra'];
  const kinds = { partial: 'Delni mrk', total: 'Popolni mrk', annular: 'Kolobarjasti mrk', penumbral: 'Polsenčni mrk' };
  const labels = { penumbral_begin: 'Začetek polsenčne faze', partial_begin: 'Začetek delne faze', total_begin: 'Začetek popolne faze', peak: 'Maksimum mrka', total_end: 'Konec popolne faze', partial_end: 'Konec delne faze', penumbral_end: 'Konec polsenčne faze' };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const dateLabel = value => { const [y,m,d] = value.slice(0,10).split('-').map(Number); return `${d}. ${months[m-1]} ${y}`; };
  const roundMinute = value => new Date(Math.round(new Date(value).getTime()/60000)*60000);
  const timeLabel = (value, withZone = false) => {
    if (!value) return '—';
    const date = roundMinute(value);
    const result = new Intl.DateTimeFormat('en-GB', { timeZone:ZONE, hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(date);
    if (!withZone) return result;
    const offset = new Intl.DateTimeFormat('en-US', { timeZone:ZONE, timeZoneName:'shortOffset' }).formatToParts(date).find(p => p.type === 'timeZoneName').value;
    return `${result} ${offset === 'GMT+2' ? 'CEST' : 'CET'}`;
  };
  const countdown = (utc, now = Date.now()) => {
    let seconds = Math.max(0, Math.floor((new Date(utc).getTime()-now)/1000));
    const days = Math.floor(seconds/86400); seconds %= 86400;
    const hours = Math.floor(seconds/3600); seconds %= 3600;
    return `${days} ${days%100===1?'dan':'dni'} · ${hours} h · ${Math.floor(seconds/60)} min`;
  };
  const localDate = value => new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(roundMinute(value));
  const shortDate = value => {const [,month,day]=localDate(value).split('-').map(Number);return `${day}. ${month}.`;};
  const interval = (windows,dates=true) => windows.length ? windows.map(w => dates&&localDate(w.start)!==localDate(w.end) ? `${shortDate(w.start)} ${timeLabel(w.start)}–${shortDate(w.end)} ${timeLabel(w.end)}` : `${timeLabel(w.start)}–${timeLabel(w.end)}`).join(', ') : 'Ni nad obzorjem';
  const nextMoon = (events, now = Date.now()) => events.find(e => new Date(e.utc).getTime() > now);
  const nextEclipse = (events, city, now = Date.now()) => events.find(e => e.cities[city].windows.some(w => new Date(w.end).getTime() > now));
  const nextPerseids = (events, city, now = Date.now()) => events.find(e => e.nights.some(n => new Date(n.cities[city].dark_end).getTime() > now));
  const nextNight = (season, city, now = Date.now()) => {
    if (!season) return null;
    const middle = season.nights[1];
    return new Date(middle.cities[city].dark_end).getTime() > now ? middle : season.nights.find(n => new Date(n.cities[city].dark_end).getTime() > now);
  };
  // Pure functions are also exercised without a browser in the astronomy test.
  globalThis.AstronomyTools = { dateLabel, timeLabel, countdown, interval, nextMoon, nextEclipse, nextPerseids, nextNight };
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-astronomy]');
  if (!root) return;
  const payload = root.querySelector('[data-astronomy-payload]');
  if (!payload) return;
  let data;
  try { data = JSON.parse(payload.textContent); } catch (_) { return; }
  const $ = selector => root.querySelector(selector);
  const put = (selector, text) => { const element = $(selector); if (element) element.textContent = text; };
  const isMoon = root.dataset.astronomy === 'moon';
  const isPerseids = data.kind === 'perseids';
  const params = new URLSearchParams(location.search);
  let city = data.city || 'ljubljana';
  if (data.cities?.some(c => c.id === params.get('city'))) city = params.get('city');
  const localYear = +new Intl.DateTimeFormat('en-CA',{timeZone:ZONE,year:'numeric'}).format(new Date());
  let upcoming = isMoon ? nextMoon(data.events) : isPerseids ? nextPerseids(data.events,city) : nextEclipse(data.events,city);
  let year = isMoon ? localYear : upcoming?.year || localYear;
  if (data.years.includes(+params.get('year'))) year = +params.get('year');
  if (!data.years.includes(year)) year = data.years[data.years.length-1];
  let selectedEvent = null;
  const name = () => data.cities?.find(c => c.id === city)?.name || '';
  const rows = () => isPerseids ? data.events.find(e => e.year === year).nights : data.events.filter(e => e.year === year);
  const local = event => event.cities[city];

  function updateUpcoming() {
    upcoming = isMoon ? nextMoon(data.events) : isPerseids ? nextPerseids(data.events,city) : nextEclipse(data.events,city);
    $('[data-next-event]').hidden = !upcoming;
    $('[data-next-empty]').hidden = !!upcoming;
    if (!upcoming) return;
    let instant;
    const dateNode = $('[data-next-date]');
    if (isMoon) {
      put('[data-next-date]', dateLabel(upcoming.date));
      put('[data-next-time]', `${upcoming.time} ${upcoming.zone}`);
      put('[data-next-context]', `${upcoming.label} · ${ZONE}`);
      instant = upcoming.utc;
      dateNode.dateTime = instant;
    } else if (isPerseids) {
      const night = nextNight(upcoming,city), day = +night.date.slice(8,10), view = local(night);
      put('[data-next-date]', `${day}./${day+1}. avgust ${upcoming.year}`);
      put('[data-next-time]', 'Načrt za temno noč');
      put('[data-next-context]', `${name()} · ${timeLabel(view.dark_start)}–${timeLabel(view.dark_end)}`);
      instant = view.dark_start; dateNode.dateTime = night.date;
    } else {
      const view = local(upcoming);
      put('[data-next-date]', dateLabel(upcoming.date));
      put('[data-next-time]', kinds[view.kind]);
      put('[data-next-context]', `${name()} · ${interval(view.windows)}`);
      instant = view.windows.find(w => new Date(w.end).getTime() > Date.now()).start;
      dateNode.dateTime = upcoming.date;
    }
    $('[data-countdown]').dataset.countdown = instant;
    put('[data-countdown]', new Date(instant).getTime() <= Date.now() && !isMoon ? 'Opazovalno okno poteka' : countdown(instant));
  }

  function moonRows() {
    const next = nextMoon(data.events);
    $('[data-moon-rows]').innerHTML = rows().map(e => `<tr${e.id === next?.id ? ' class="is-upcoming"' : ''}><th scope="row"><time datetime="${escape(e.utc)}">${dateLabel(e.date)}</time></th><td><span class="astro-phase-dot phase-${e.kind}" aria-hidden="true"></span>${e.label}</td><td><strong>${e.time}</strong> <span class="astro-muted">${e.zone}</span></td><td>${e.utc.slice(11,16)}${e.utc.slice(0,10)!==e.date ? `<small class="astro-utc-date">${dateLabel(e.utc)}</small>` : ''}</td></tr>`).join('');
  }
  function eclipseRows() {
    $('[data-eclipse-rows]').innerHTML = rows().map(e => {
      const v = local(e);
      return `<tr><th scope="row"><a href="#astro-event-selection" data-select-event="${e.id}">${dateLabel(e.date)}</a></th><td>${kinds[e.kind]}</td><td><span class="astro-status ${v.visible ? 'is-visible':'is-invisible'}">${v.visible ? kinds[v.kind]:'Ni viden'}</span></td><td>${v.visible ? interval(v.windows):'—'}</td></tr>`;
    }).join('');
    if (!rows().some(e => e.id === selectedEvent)) selectedEvent = (rows().find(e => local(e).visible) || rows()[0])?.id;
    const select = $('[data-astro-event]');
    select.innerHTML = rows().map(e => `<option value="${e.id}">${dateLabel(e.date)} · ${kinds[e.kind]}</option>`).join('');
    select.value = selectedEvent;
    eventDetail();
  }

  function visibilityChart(view,compact=null) {
    if(compact===null) return visibilityChart(view,false)+visibilityChart(view,true);
    const track = view.track || [];
    if (!track.length) return '';
    const a = new Date(track[0][0]).getTime(), b = new Date(track.at(-1)[0]).getTime();
    const width=compact?400:800,x0=compact?40:45,span=compact?320:710,font=compact?16:14;
    const low = Math.floor(Math.min(-5,...track.map(p=>p[1]-4))), high = Math.ceil(Math.max(5,...track.map(p=>p[1]+4)));
    const x = utc => x0+(new Date(utc).getTime()-a)/(b-a)*span;
    const y = altitude => 20+(high-altitude)/(high-low)*150;
    const p = track.map(([utc,alt],i)=>`${i?'L':'M'}${x(utc).toFixed(2)},${y(alt).toFixed(2)}`).join(' ');
    const bands = view.windows.map(w=>`<rect x="${x(w.start).toFixed(2)}" y="20" width="${(x(w.end)-x(w.start)).toFixed(2)}" height="150" fill="#005da4" opacity=".065"/>`).join('');
    const ticks = (compact?[0,11,21,32]:[0,8,16,24,32]).map(i=>`<text x="${x(track[i][0]).toFixed(2)}" y="196" fill="#38506a" font-size="${font}" text-anchor="middle">${timeLabel(track[i][0])}</text>`).join('');
    const endpointLabels = [[31,high],[170,low]].filter(([baseline])=>Math.abs(baseline-y(0)-5)>font+3).map(([baseline,altitude])=>`<text x="5" y="${baseline}" fill="#607083" font-size="${font-1}">${altitude}°</text>`).join('');
    return `<svg class="astro-altitude-chart astro-altitude-chart--${compact?'mobile':'desktop'}" viewBox="0 0 ${width} 210" role="img" aria-label="Višina središča ${data.kind==='solar'?'Sonca':'Lune'} nad ravnim obzorjem med mrkom. Rdeča črtkana črta označuje obzorje."><rect x="${x0}" y="20" width="${span}" height="150" rx="3" fill="#f1f6fb"/><rect x="${x0}" y="${y(0)}" width="${span}" height="${170-y(0)}" fill="#e8ecf1"/>${bands}<line x1="${x0}" x2="${x0+span}" y1="${y(0)}" y2="${y(0)}" stroke="#c52d45" stroke-width="1.5" stroke-dasharray="6 5"/><text x="5" y="${y(0)+5}" fill="#9d263c" font-size="${font}">0°</text>${endpointLabels}<path d="${p}" fill="none" stroke="#005da4" stroke-width="3.5" stroke-linecap="round"/>${ticks}</svg>`;
  }
  function eventDetail() {
    const event = rows().find(e=>e.id===selectedEvent) || rows()[0];
    if (!event) return;
    const view = local(event);
    put('[data-detail-city]',name()); put('[data-detail-title]',dateLabel(event.date));
    const status = $('[data-detail-status]');
    status.textContent = view.visible ? `${kinds[view.kind]} nad obzorjem` : 'Iz kraja ni viden';
    status.className = `astro-status ${view.visible?'is-visible':'is-invisible'}`;
    $('[data-detail-summary]').innerHTML = view.visible ? `Izračunano okno nad ravnim obzorjem: <strong>${interval(view.windows)}</strong>.${view.peak_visible?'':' <strong>Maksimum je pod obzorjem.</strong> Viden je samo del poteka.'}` : 'Ta mrk se zgodi drugje na Zemlji. Za izbrani kraj ni izračunanega intervala, v katerem bi bil mrk nad obzorjem.';
    $('[data-detail-chart]').innerHTML = visibilityChart(view);
    $('[data-detail-chart-key]').hidden = !view.visible;
    $('[data-detail-contacts]').innerHTML = Object.entries(view.contacts).map(([key,c])=>{
      let label = labels[key];
      if (view.geometric_kind === 'annular' && key === 'total_begin') label = 'Začetek kolobarjaste faze';
      if (view.geometric_kind === 'annular' && key === 'total_end') label = 'Konec kolobarjaste faze';
      return `<div class="astro-contact ${c.above_horizon?'is-above':'is-below'}"><span>${label}</span><time datetime="${escape(c.utc)}">${timeLabel(c.utc)}${localDate(c.utc)!==event.date?`<small class="astro-contact-date">${shortDate(c.utc)}</small>`:''}</time><small>${c.above_horizon?'Nad obzorjem':'Pod obzorjem'} · ${String(c.altitude).replace('.',',')}°</small></div>`;
    }).join('');
    const utcPeak=roundMinute(event.peak).toISOString();
    $('[data-detail-global]').innerHTML = `Globalni maksimum: <strong>${timeLabel(event.peak,true)}</strong> (${dateLabel(utcPeak)}, ${utcPeak.slice(11,16)} UTC). ${data.kind==='solar'?'To je vrhunec mrka na Zemlji, ne ura največjega zakritja v izbranem kraju.':'Trenutek maksimuma je skupen, njegova vidnost pa je odvisna od kraja.'}`;
    const percent = $('[data-detail-percent]');
    percent.hidden = !(data.kind==='solar' && view.peak_visible);
    percent.innerHTML = percent.hidden ? '' : `Ob lokalnem maksimumu Luna prekrije približno <strong>${String(view.peak_obscuration).replace('.',',')} % Sončeve ploskve</strong>. To je delež površine, ne magnituda mrka, ki meri prekriti delež premera.`;
  }
  function perseidRows() {
    $('[data-perseids-nights]').innerHTML = rows().map(n=>{
      const view = local(n), day = +n.date.slice(8,10), a = new Date(view.dark_start).getTime(), duration = new Date(view.dark_end).getTime()-a;
      const blocks = view.moon_free.map(w=>`<span style="left:${((new Date(w.start).getTime()-a)/duration*100).toFixed(3)}%;width:${((new Date(w.end)-new Date(w.start))/duration*100).toFixed(3)}%"></span>`).join('');
      return `<section class="astro-night"><div class="astro-night-date"><span>NOČ</span><h3>${day}./${day+1}.</h3><p>avgust ${year}</p></div><div class="astro-night-main"><div class="astro-night-heading"><strong>${escape(name())} · astronomska tema</strong><span>${timeLabel(view.dark_start)}–${timeLabel(view.dark_end)}</span></div><div class="astro-night-bar" role="img" aria-label="Modri deli označujejo astronomsko temo, ko je Luna pod obzorjem.">${blocks}</div><div class="astro-night-facts"><span><strong>${n.moon_illumination} %</strong> Lune osvetljene ob polnoči</span><span><strong>Brez Lune:</strong> ${view.moon_free.length?interval(view.moon_free,false):'v tej temni noči ni takega intervala'}</span>${view.moonrise?`<span>Lunin vzhod: ${timeLabel(view.moonrise)}</span>`:''}${view.moonset?`<span>Lunin zahod: ${timeLabel(view.moonset)}</span>`:''}</div></div></section>`;
    }).join('');
  }
  function render(updateUrl=false) {
    $('[data-astro-year]').value = year;
    if ($('[data-astro-city]')) $('[data-astro-city]').value = city;
    const prefix = isMoon ? ({full_moon:'Polne lune',new_moon:'Mlaji',all:'Lunine mene'})[data.kind] : isPerseids ? 'Perzeidi' : data.kind==='solar'?'Sončevi mrki':'Lunini mrki';
    put('[data-year-title]',`${prefix} ${year}`);
    root.querySelectorAll('[data-city-name]').forEach(el=>el.textContent=name());
    const ics = $('[data-astro-ics]');
    const count = isMoon||isPerseids ? rows().length : rows().filter(e=>local(e).visible).length;
    ics.href = `/astronomy/${data.kind}-${year}${isMoon?'':`-${city}`}.ics`;
    ics.setAttribute('aria-disabled',count ? 'false':'true');
    if (!count) ics.removeAttribute('href');
    ics.textContent = !count ? 'Ni vidnih mrkov za ICS' : isPerseids ? 'Dodaj noči · ICS' : 'Prenesi ICS';
    if (isMoon) {
      moonRows();
      const source = $('[data-moon-source]');
      if (source) { source.href = `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}`; source.textContent = `izvirna tabela USNO ${year}`; }
    } else if (isPerseids) perseidRows(); else eclipseRows();
    updateUpcoming();
    if (updateUrl) {
      const url = new URL(location.href); url.searchParams.set('year',year);
      if (!isMoon) url.searchParams.set('city',city);
      history.replaceState(null,'',url);
      put('[data-astro-announcement]',`${prefix} ${year}${isMoon?'':` · ${name()}`}. Prikaz je posodobljen.`);
    }
  }
  const announcement = document.createElement('p');
  announcement.className='sr-only'; announcement.dataset.astroAnnouncement=''; announcement.setAttribute('role','status'); root.append(announcement);
  $('[data-astro-form]').addEventListener('submit',event=>{event.preventDefault(); render(true);});
  $('[data-astro-year]').addEventListener('change',event=>{year=+event.target.value;selectedEvent=null;render(true);});
  $('[data-astro-city]')?.addEventListener('change',event=>{city=event.target.value;selectedEvent=null;render(true);});
  $('[data-astro-event]')?.addEventListener('change',event=>{selectedEvent=event.target.value;eventDetail();});
  root.addEventListener('click',event=>{
    const link=event.target.closest('[data-select-event]');
    if(link){event.preventDefault();selectedEvent=link.dataset.selectEvent;$('[data-astro-event]').value=selectedEvent;eventDetail();$('.astro-event-detail').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});$('[data-astro-event]').focus({preventScroll:true});}
    if(event.target.closest('[data-astro-print]')) window.print();
    if(event.target.closest('[aria-disabled="true"]')) event.preventDefault();
  });
  root.classList.add('astro-enhanced');
  render();
  window.setInterval(updateUpcoming,30000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateUpcoming();});
})();
