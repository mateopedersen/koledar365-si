const DAY = 86400000;
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
export function addDays(value, days) { return new Date(new Date(`${value}T12:00:00Z`).valueOf() + days * DAY).toISOString().slice(0, 10); }
export function todayInLjubljana(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const escapeICS = value => String(value ?? '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
export function foldLine(value) {
  const encoder = new TextEncoder(); const lines = []; let line = ''; let size = 0;
  for (const character of value) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > 75) { lines.push(line); line = ' '; size = 1; }
    line += character; size += bytes;
  }
  lines.push(line); return lines.join('\r\n');
}
export const icalStamp = date => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
export function formatDate(value) { return new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)); }
export function formatRange(event) { return event.start === event.end ? formatDate(event.start) : `${formatDate(event.start)}–${formatDate(event.end)}`; }
export function eventContext(payload, event) {
  return [event.examType && (event.examType === 'general' ? 'Splošna matura' : 'Poklicna matura'), event.kind === 'npz' && `${event.grades.join(', ')}. razred`, event.institution && payload.institutions.find(i => i.id === event.institution)?.name].filter(Boolean).join(' · ');
}
export function normaliseState(payload, input = {}) {
  const state = { ...payload.initial, ...input };
  for (const [key, allowed] of Object.entries({ level: ['primary', 'secondary'], region: ['west', 'east'], grade: ['all', '1', '2', '3', '4', '5', '6', '7', '8', '9'], stage: ['all', 'final', 'other'], examType: ['general', 'vocational'], session: ['all', 'spring', 'autumn'], institution: ['all', ...payload.institutions.map(i => i.id)], category: ['all', ...Object.keys(payload.categories)] })) {
    if (!allowed.includes(String(state[key]))) state[key] = payload.initial[key];
  }
  if (payload.config.exam_type) state.examType = payload.config.exam_type;
  if (payload.config.grade) state.grade = payload.config.grade;
  if (payload.kind === 'school' && state.level === 'secondary') state.grade = 'all';
  if (payload.kind === 'npz' && !['all', '3', '6', '9'].includes(state.grade)) state.grade = payload.initial.grade;
  const allowedSubjects = new Set(payload.events.filter(e => !e.examType || e.examType === state.examType).flatMap(e => e.subjects || []));
  state.subjects = Array.isArray(state.subjects) ? [...new Set(state.subjects)].filter(s => allowedSubjects.has(s)) : [];
  state.upcoming = state.upcoming === true || state.upcoming === '1';
  return state;
}
export function filterEvents(payload, input, today = todayInLjubljana()) {
  const state = normaliseState(payload, input);
  return payload.events.filter(e => {
    if (payload.kind === 'school' && ((e.level || 'primary') !== state.level || (e.region && e.region !== state.region))) return false;
    if (state.grade !== 'all' && e.grades && !e.grades.includes(Number(state.grade))) return false;
    if (payload.kind === 'school' && state.level === 'secondary' && state.stage !== 'all' && e.stage && e.stage !== state.stage) return false;
    if (payload.kind === 'matura' && (e.examType !== state.examType || (state.session !== 'all' && e.session !== 'both' && e.session !== state.session))) return false;
    if (payload.kind === 'study' && state.institution !== 'all' && e.institution !== state.institution) return false;
    if (state.category !== 'all' && e.category !== state.category) return false;
    if (state.subjects.length && e.subjects && !state.subjects.some(s => e.subjects.includes(s))) return false;
    if (state.upcoming && e.end < today) return false;
    return true;
  });
}
export function nextEvent(events, today = todayInLjubljana()) { return events.filter(e => e.start >= today).sort((a, b) => a.start.localeCompare(b.start) || a.id.localeCompare(b.id))[0] || null; }
export function buildICS(events, payload, now = new Date()) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Koledar365//Education//SL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${escapeICS(payload.config.heading)}`, 'X-WR-TIMEZONE:Europe/Ljubljana'];
  const unique = [...new Map(events.map(e => [e.id, e])).values()];
  for (const event of unique) {
    if (!validDate(event.start) || !validDate(event.end) || event.end < event.start) throw new Error('Neveljavno obdobje dogodka.');
    const source = payload.sources.find(s => s.id === event.source);
    const context = eventContext(payload, event);
    const description = [context, event.note, source && `Vir: ${source.title}\n${source.url}`, `Preverjeno: ${payload.reviewedAt}. Enkraten izvoz; spremembe preverite pri viru.`].filter(Boolean).join('\n\n');
    lines.push('BEGIN:VEVENT', `UID:${event.id}@koledar365.si`, `DTSTAMP:${icalStamp(now)}`, `DTSTART;VALUE=DATE:${event.start.replace(/-/g, '')}`, `DTEND;VALUE=DATE:${addDays(event.end, 1).replace(/-/g, '')}`, `SUMMARY:${escapeICS(`${event.title}${context ? ` · ${context}` : ''}`)}`, `DESCRIPTION:${escapeICS(description)}`, `CATEGORIES:${escapeICS(payload.categories[event.category] || '')}`, 'TRANSP:TRANSPARENT');
    if (source) lines.push(`URL:${source.url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR'); return lines.map(foldLine).join('\r\n') + '\r\n';
}
export function monthCells(year, month) {
  const first = new Date(Date.UTC(year, month - 1, 1, 12)); const offset = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: 42 }, (_, i) => i < offset || i >= offset + count ? null : `${year}-${String(month).padStart(2, '0')}-${String(i - offset + 1).padStart(2, '0')}`);
}
function monthName(value) { return new Intl.DateTimeFormat('sl-SI', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}-01T12:00:00Z`)); }
export function yearHTML(payload, events, interactive = true) {
  const [start, end] = payload.range; let year = Number(start.slice(0, 4)); let month = Number(start.slice(5, 7)); const result = [];
  while (`${year}-${String(month).padStart(2, '0')}-01` <= end) {
    const key = `${year}-${String(month).padStart(2, '0')}`;
    result.push(`<section class="ed-mini-month"><h3>${escapeHTML(monthName(key))}</h3><div class="ed-mini-weekdays" aria-hidden="true">${['P', 'T', 'S', 'Č', 'P', 'S', 'N'].map(d => `<span>${d}</span>`).join('')}</div><div class="ed-mini-days">${monthCells(year, month).map(date => {
      if (!date) return '<span class="ed-mini-blank"></span>';
      const matches = events.filter(e => e.start <= date && e.end >= date);
      const category = matches.find(e => !['semester', 'break', 'holiday'].includes(e.category))?.category || matches[0]?.category || '';
      const title = `${formatDate(date)}${matches.length ? ': ' + matches.map(e => e.title).join('; ') : ''}`;
      return interactive ? `<button type="button" data-ed-day="${date}" data-category="${category}" aria-label="${escapeHTML(title)}" title="${escapeHTML(title)}">${Number(date.slice(8))}${matches.length ? '<i></i>' : ''}</button>` : `<span data-category="${category}" title="${escapeHTML(title)}">${Number(date.slice(8))}${matches.length ? '<i></i>' : ''}</span>`;
    }).join('')}</div></section>`);
    month++; if (month > 12) { year++; month = 1; }
  }
  return result.join('');
}
export function download(content, filename, type) {
  const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.hidden = true; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function initEducation(root) {
  const payload = JSON.parse(document.getElementById('education-data').textContent); const form = root.querySelector('[data-ed-filters]');
  const url = new URL(location.href); const input = Object.fromEntries(url.searchParams.entries()); input.subjects = url.searchParams.getAll('subject');
  let state = normaliseState(payload, input); let today = todayInLjubljana(); let view = 'list'; let selected = new Set(); let visible = [];
  const $ = selector => root.querySelector(selector); const $$ = selector => [...root.querySelectorAll(selector)];
  function toast(message) { const box = $('[data-ed-toast]'); box.textContent = message; box.hidden = false; clearTimeout(box.hideTimer); box.hideTimer = setTimeout(() => box.hidden = true, 6000); }
  function syncForm() {
    for (const [key, value] of Object.entries(state)) { const input = form.elements.namedItem(key); if (input && key !== 'subjects') input.type === 'checkbox' ? input.checked = value : input.value = value; }
    if (payload.kind === 'matura') {
      const subjects = [...new Set(payload.events.filter(e => e.examType === state.examType).flatMap(e => e.subjects || []))].sort((a, b) => payload.subjects[a].localeCompare(payload.subjects[b], 'sl'));
      $('[data-ed-subjects]').innerHTML = subjects.map(id => `<label><input type="checkbox" name="subject" value="${id}" ${state.subjects.includes(id) ? 'checked' : ''}><span>${escapeHTML(payload.subjects[id])}</span></label>`).join('');
      filterSubjectChoices();
    }
    if ($('[data-ed-primary]')) $('[data-ed-primary]').hidden = state.level !== 'primary';
    if ($('[data-ed-secondary]')) $('[data-ed-secondary]').hidden = state.level !== 'secondary';
    if ($('[data-ed-institution-note]')) $('[data-ed-institution-note]').textContent = payload.institutions.find(i => i.id === state.institution)?.note || 'Primerjava ločenih koledarjev. Termini posamezne članice se ne prenašajo na druge ustanove.';
  }
  function filterSubjectChoices() {
    const search = $('[data-ed-subject-search]'); if (!search) return;
    const normal = value => value.toLocaleLowerCase('sl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const query = normal(search.value.trim()); $$('[data-ed-subjects] label').forEach(label => label.hidden = !normal(label.textContent).includes(query));
  }
  function syncURL() {
    const next = new URL(location.href); next.search = '';
    const relevant = { school: ['level', 'region', 'grade', 'stage'], matura: ['examType', 'session'], npz: ['grade'], study: ['institution'] }[payload.kind];
    for (const key of [...relevant, 'category']) if (state[key] !== payload.initial[key]) next.searchParams.set(key, state[key]);
    if (state.upcoming) next.searchParams.set('upcoming', '1');
    state.subjects.forEach(id => next.searchParams.append('subject', id));
    history.replaceState(null, '', next);
  }
  function eventHTML(event, selection = true) {
    const source = payload.sources.find(s => s.id === event.source); const context = eventContext(payload, event);
    return `<article class="ed-event" data-event-id="${event.id}" data-category="${event.category}">${selection ? `<label class="ed-event-select"><input type="checkbox" data-ed-select="${event.id}" ${selected.has(event.id) ? 'checked' : ''} aria-label="${escapeHTML(`Izberi: ${event.title}, ${formatRange(event)}`)}"></label>` : ''}<div class="ed-event-date"><time datetime="${event.start}">${formatRange(event)}</time><span>${escapeHTML(payload.categories[event.category])}</span></div><div class="ed-event-copy"><h4>${escapeHTML(event.title)}</h4>${context ? `<small>${escapeHTML(context)}</small>` : ''}${event.note ? `<p>${escapeHTML(event.note)}</p>` : ''}${source ? `<a href="${escapeHTML(source.url)}" target="_blank" rel="noopener">Uradni vir <span aria-hidden="true">↗</span></a>` : ''}</div></article>`;
  }
  function timelineHTML(events, selection = true) {
    const groups = new Map(); for (const event of events) { const key = event.start.slice(0, 7); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(event); }
    return [...groups].map(([key, rows]) => `<section class="ed-month-group"><h3>${escapeHTML(monthName(key))}</h3><div>${rows.map(e => eventHTML(e, selection)).join('')}</div></section>`).join('');
  }
  function updateSelection() {
    $('[data-ed-selected-count]').textContent = `Izbrano: ${selected.size}`;
    $('[data-ed-ics]').textContent = selected.size ? `Prenesi izbrane (${selected.size}) · ICS` : 'Prenesi prikazane · ICS';
    $('[data-ed-print]').textContent = selected.size ? `Natisni izbrane (${selected.size})` : 'Natisni / shrani PDF';
    for (const control of ['[data-ed-ics]', '[data-ed-print]', '[data-ed-select-all]']) $(control).disabled = visible.length === 0;
    $('[data-ed-clear]').disabled = selected.size === 0;
  }
  function render() {
    visible = filterEvents(payload, state, today); const ids = new Set(visible.map(e => e.id)); selected = new Set([...selected].filter(id => ids.has(id)));
    const upcoming = nextEvent(visible, today);
    $('[data-ed-next-title]').textContent = upcoming?.title || 'V tem pregledu ni prihodnjih datumov.';
    $('[data-ed-next-context]').textContent = upcoming ? eventContext(payload, upcoming) : 'Objavljena obdobja in pretekle datume si lahko ogledate spodaj.';
    $('[data-ed-next-date]').textContent = upcoming ? formatDate(upcoming.start) : '—';
    if (upcoming) $('[data-ed-next-date]').setAttribute('datetime', upcoming.start); else $('[data-ed-next-date]').removeAttribute('datetime');
    $('[data-ed-count]').textContent = `${visible.length} dogodkov v izbranem pregledu`;
    $('[data-ed-list]').innerHTML = timelineHTML(visible);
    $('[data-ed-list]').hidden = view !== 'list'; $('[data-ed-year]').hidden = view !== 'year';
    if (view === 'year') $('[data-ed-year]').innerHTML = yearHTML(payload, visible);
    $('[data-ed-day-detail]').hidden = true; $('[data-ed-empty]').hidden = visible.length > 0;
    $$('[data-ed-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.edView === view)));
    updateSelection(); syncForm();
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('change', () => {
    const fd = new FormData(form); state = normaliseState(payload, { ...state, ...Object.fromEntries(fd), subjects: fd.getAll('subject'), upcoming: fd.has('upcoming') }); render(); syncURL();
  });
  form.addEventListener('reset', event => { event.preventDefault(); state = normaliseState(payload); selected.clear(); if ($('[data-ed-subject-search]')) $('[data-ed-subject-search]').value = ''; render(); syncURL(); });
  $('[data-ed-subject-search]')?.addEventListener('input', filterSubjectChoices);
  root.addEventListener('change', event => { const checkbox = event.target.closest('[data-ed-select]'); if (!checkbox) return; checkbox.checked ? selected.add(checkbox.dataset.edSelect) : selected.delete(checkbox.dataset.edSelect); updateSelection(); });
  root.addEventListener('click', event => {
    const control = event.target.closest('button'); if (!control) return;
    if (control.hasAttribute('data-ed-view')) { view = control.dataset.edView; render(); }
    if (control.hasAttribute('data-ed-select-all')) { selected = new Set(visible.map(e => e.id)); render(); }
    if (control.hasAttribute('data-ed-clear')) { selected.clear(); render(); }
    if (control.hasAttribute('data-ed-day')) {
      const date = control.dataset.edDay; const matches = visible.filter(e => e.start <= date && e.end >= date); const output = $('[data-ed-day-detail]');
      output.textContent = `${formatDate(date)} · ${matches.length ? matches.map(e => `${e.title}${eventContext(payload, e) ? ' (' + eventContext(payload, e) + ')' : ''}`).join('; ') : 'Ni dogodkov za izbrane filtre.'}`; output.hidden = false;
    }
    const exported = visible.filter(e => selected.size === 0 || selected.has(e.id));
    if (control.hasAttribute('data-ed-ics')) { try { const name = {school:'solski-koledar',study:'studijski-koledar',npz:`npz-${state.grade === 'all' ? 'vsi-razredi' : state.grade+'-razred'}`,matura:state.examType === 'general' ? 'splosna-matura' : 'poklicna-matura'}[payload.kind]; download(buildICS(exported, payload), `${name}-2026-2027.ics`, 'text/calendar;charset=utf-8'); toast(`Prenesenih dogodkov: ${exported.length}. Datoteko ICS uvozite v svoj koledar.`); } catch (error) { toast(error.message); } }
    if (control.hasAttribute('data-ed-print')) {
      const year = view === 'year' && selected.size === 0; const usedSources = payload.sources.filter(s => exported.some(e => e.source === s.id));
      const context = [payload.kind === 'school' ? (state.level === 'secondary' ? 'Srednja šola' : 'Osnovna šola') : '', payload.kind === 'school' ? (state.region === 'east' ? 'Vzhodna skupina' : 'Zahodna skupina') : '', payload.kind === 'matura' ? (state.examType === 'general' ? 'Splošna matura' : 'Poklicna matura') : '', payload.kind === 'matura' ? ({spring:'Spomladanski rok',autumn:'Jesenski rok',all:'Oba roka'}[state.session]) : '', payload.kind === 'study' ? (payload.institutions.find(i => i.id === state.institution)?.name || 'Primerjava ustanov') : '', state.grade !== 'all' ? `${state.grade}. razred` : '', state.category !== 'all' ? payload.categories[state.category] : '', state.upcoming ? 'Prihodnji in tekoči dogodki' : '', `${exported.length} dogodkov`].filter(Boolean).join(' · ');
      const outside = exported.filter(e => e.start < payload.range[0] || e.end > payload.range[1]);
      const outsideNote = outside.length ? `<p class="ed-print-legend">Obdobja zunaj prikazanih mesecev: ${escapeHTML(outside.map(e => `${e.title}: ${formatRange(e)}`).join('; '))}.</p>` : '';
      $('[data-ed-print-sheet]').innerHTML = `<header><span>KOLEDAR365 · SLOVENIJA</span><h1>${escapeHTML(payload.config.heading)}</h1><p>${escapeHTML(context)}</p></header>${year ? `<div class="ed-print-year">${yearHTML(payload, exported, false)}</div><p class="ed-print-legend">Modro: pouk, semestri in roki · Rdeče: izpiti in rezultati · Svetlo modro: počitnice in prosti dnevi. Podrobnosti posameznih datumov: koledar365.si${payload.path}</p>${outsideNote}` : `<div class="ed-print-list">${timelineHTML(exported, false)}</div>`}<footer>Preverjeno ${formatDate(payload.reviewedAt)} · ${escapeHTML(usedSources.map(s => s.title).join('; '))}<br>Izpitna obdobja niso osebni termini. Spremembe preverite pri šoli oziroma ustanovi. koledar365.si${payload.path}</footer>`;
      root.classList.toggle('ed-printing-year', year); document.body.classList.add('education-printing'); window.print();
    }
  });
  window.addEventListener('afterprint', () => { document.body.classList.remove('education-printing'); root.classList.remove('ed-printing-year'); });
  $$('[data-ed-requires-js]').forEach(button => button.disabled = false); render();
  setInterval(() => { const current = todayInLjubljana(); if (current !== today) { today = current; render(); } }, 60000);
}
if (typeof document !== 'undefined') { const root = document.querySelector('[data-education-page]'); if (root) initEducation(root); }
