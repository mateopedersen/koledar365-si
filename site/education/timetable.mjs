import { validDate, addDays, todayInLjubljana, escapeHTML, escapeICS, foldLine, icalStamp, formatDate, download } from './experience.mjs';

const DAYS = ['Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek', 'Sobota', 'Nedelja'];
const STORAGE_KEY = 'k365.school-timetable.v1';
const plural = (count, forms) => forms[new Intl.PluralRules('sl').select(count)];
const uid = () => globalThis.crypto?.randomUUID?.() || `lesson-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateWeekday = date => new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
export const mondayOf = date => addDays(date, 1 - dateWeekday(date));
export function defaultPlan() { return { schema: 'koledar365-school-timetable', version: 1, title: 'Moj šolski urnik', className: '', from: '2026-09-01', to: '2027-06-24', level: 'primary', region: 'west', skipBreaks: true, lessons: [] }; }
function cleanText(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b-\u001f]/.test(value)) throw new Error('Besedilo je predolgo ali vsebuje neveljavne znake.');
  const text = value.trim(); if (required && !text) throw new Error('Vnesite ime predmeta.'); return text;
}
export function validateLesson(input) {
  if (!input || typeof input !== 'object') throw new Error('Vnos učne ure ni veljaven.');
  const id = String(input.id || uid()); if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error('Neveljavna oznaka učne ure.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input.endTime)) throw new Error('Vnesite veljaven začetni in končni čas.');
  if (input.endTime <= input.startTime) throw new Error('Konec učne ure mora biti pozneje kot začetek.');
  if (!['weekly', 'once'].includes(input.repeat)) throw new Error('Izberite tedensko ponavljanje ali en datum.');
  let day = Number(input.day); let date = '';
  if (input.repeat === 'once') { if (!validDate(input.date)) throw new Error('Izberite veljaven datum.'); date = input.date; day = dateWeekday(date); }
  if (!Number.isInteger(day) || day < 1 || day > 7) throw new Error('Izberite dan v tednu.');
  return { id, subject: cleanText(input.subject, 80, true), day, startTime: input.startTime, endTime: input.endTime, room: cleanText(input.room || '', 40), teacher: cleanText(input.teacher || '', 80), repeat: input.repeat, date, ...(input.legacyPerson ? {legacyPerson: cleanText(input.legacyPerson,80)} : {}) };
}
export function validatePlan(input) {
  if (!input || input.schema !== 'koledar365-school-timetable' || input.version !== 1 || !Array.isArray(input.lessons) || input.lessons.length > 200) throw new Error('Datoteka ni veljavna kopija šolskega urnika (največ 200 vnosov).');
  if (!validDate(input.from) || !validDate(input.to) || input.to < input.from || input.to > addDays(input.from, 370)) throw new Error('Izberite urejeno obdobje, dolgo največ 371 koledarskih dni.');
  if (!['primary', 'secondary'].includes(input.level) || !['west', 'east'].includes(input.region) || typeof input.skipBreaks !== 'boolean') throw new Error('Nastavitve šole ali regije niso veljavne.');
  if (input.skipBreaks && (input.from < '2026-09-01' || input.to > '2027-08-31')) throw new Error('Počitnice so preverjene le za 2026/2027. Za drugo obdobje izključite izpuščanje počitnic.');
  const lessons = input.lessons.map(validateLesson); if (new Set(lessons.map(l => l.id)).size !== lessons.length) throw new Error('Kopija vsebuje podvojene oznake vnosov.');
  return { schema: input.schema, version: 1, title: cleanText(input.title || 'Moj šolski urnik', 80), className: cleanText(input.className || '', 40), from: input.from, to: input.to, level: input.level, region: input.region, skipBreaks: input.skipBreaks, lessons };
}
export function lessonOccurrences(input, data) {
  const plan = validatePlan(input); const breaks = plan.skipBreaks ? data.events.filter(e => e.level === plan.level && (!e.region || e.region === plan.region)) : [];
  const results = [];
  for (const lesson of plan.lessons) {
    const dates = [];
    if (lesson.repeat === 'once') { if (lesson.date >= plan.from && lesson.date <= plan.to) dates.push(lesson.date); }
    else { let date = addDays(plan.from, (lesson.day - dateWeekday(plan.from) + 7) % 7); for (; date <= plan.to; date = addDays(date, 7)) dates.push(date); }
    for (const date of dates) if (!breaks.some(e => e.start <= date && e.end >= date)) results.push({ ...lesson, date });
  }
  return results.sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id));
}
export function findConflicts(occurrences) {
  const dates = new Map(); const conflicts = [];
  for (const lesson of occurrences) { if (!dates.has(lesson.date)) dates.set(lesson.date, []); dates.get(lesson.date).push(lesson); }
  for (const [date, lessons] of dates) for (let i = 0; i < lessons.length; i++) for (let j = i + 1; j < lessons.length; j++) {
    const a = lessons[i], b = lessons[j]; if (a.startTime < b.endTime && b.startTime < a.endTime) conflicts.push({ date, first: a, second: b });
  }
  return conflicts;
}
const localParts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Ljubljana', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function wallStamp(instant) {
  const p = Object.fromEntries(localParts.formatToParts(new Date(instant)).map(part => [part.type, part.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}
export function localDateTimeToUTC(date, time) {
  if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error('Neveljaven datum ali čas.');
  const wall = `${date}T${time}:00`; const naive = Date.parse(wall + 'Z'); const matches = [];
  const offsets = new Set([-86400000, 0, 86400000].map(delta => { const instant = naive + delta; return instant - Date.parse(wallStamp(instant) + 'Z'); }));
  for (const offset of offsets) { const instant = naive + offset; if (wallStamp(instant) === wall) matches.push(instant); }
  if (matches.length !== 1) throw new Error(`Ura ${time} na datum ${formatDate(date)} je zaradi premika ure ${matches.length ? 'dvoumna' : 'neobstoječa'}. Izberite drug čas.`);
  return new Date(matches[0]);
}
export function buildTimetableICS(plan, data, now = new Date()) {
  const clean = validatePlan(plan); const occurrences = lessonOccurrences(clean, data);
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Koledar365//School timetable//SL', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${escapeICS(clean.title)}`, 'X-WR-TIMEZONE:Europe/Ljubljana'];
  for (const lesson of occurrences) {
    const from = localDateTimeToUTC(lesson.date, lesson.startTime); const to = localDateTimeToUTC(lesson.date, lesson.endTime);
    const description = [clean.className && `Razred: ${clean.className}`, lesson.teacher && `Učitelj/učiteljica: ${lesson.teacher}`, lesson.legacyPerson && `Oseba (prejšnji planer): ${lesson.legacyPerson}`, 'Čas: Europe/Ljubljana.', clean.skipBreaks && 'Uradne počitnice in prazniki 2026/2027 so izpuščeni.', 'Osebni urnik. Izvoz je enkraten posnetek.'].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:school-${lesson.id}-${lesson.date}@koledar365.si`, `DTSTAMP:${icalStamp(now)}`, `DTSTART:${icalStamp(from)}`, `DTEND:${icalStamp(to)}`, `SUMMARY:${escapeICS(lesson.subject)}`, `DESCRIPTION:${escapeICS(description)}`, `LOCATION:${escapeICS(lesson.room)}`, 'TRANSP:OPAQUE', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR'); return lines.map(foldLine).join('\r\n') + '\r\n';
}
export function migrateLegacy(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.entries) || input.entries.length > 200 || !input.entries.length) throw new Error('Kopija prejšnjega planerja ne vsebuje veljavnih vnosov.');
  const dates = input.entries.map(e => e.date).filter(validDate).sort(); if (dates.length !== input.entries.length) throw new Error('Prejšnja kopija vsebuje neveljavne datume.');
  const plan = { ...defaultPlan(), from: dates[0], to: dates.at(-1), skipBreaks: false, title: input.options?.title || 'Moj šolski urnik', lessons: input.entries.map(e => ({ id: e.entry_id || uid(), subject: e.title, day: dateWeekday(e.date), startTime: e.time, endTime: e.end_time, room: e.room || '', teacher: '', legacyPerson: e.person || '', repeat: 'once', date: e.date })) };
  try { return validatePlan(plan); } catch (error) { throw new Error(`Prejšnja kopija mora vsebovati predmet ter začetni in končni čas za vsako uro. ${error.message}`); }
}
function initTimetable(root) {
  const data = JSON.parse(document.getElementById('timetable-data').textContent); const $ = selector => root.querySelector(selector); const $$ = selector => [...root.querySelectorAll(selector)]; const form = $('[data-tt-lesson]');
  let plan = defaultPlan(); let week = mondayOf($('[data-tt-week]').value); let occurrences = []; let legacy = null;
  function toast(message) { const box = $('[data-tt-toast]'); box.textContent = message; box.hidden = false; clearTimeout(box.hideTimer); box.hideTimer = setTimeout(() => box.hidden = true, 7000); }
  try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) plan = validatePlan(JSON.parse(stored)); } catch (error) { toast(`Shranjene kopije ni mogoče odpreti. ${error.message}`); }
  try { const entries = JSON.parse(localStorage.getItem('k365.entries./solski-urnik/') || '[]'); if (entries.length) { legacy = { version: 1, entries, options: JSON.parse(localStorage.getItem('k365.options./solski-urnik/') || '{}') }; $('[data-tt-legacy]').hidden = false; } } catch { /* A malformed legacy value must not prevent a new timetable. */ }
  const startWeek = todayInLjubljana(); week = mondayOf(startWeek < plan.from ? plan.from : startWeek > plan.to ? plan.to : startWeek);
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); $('[data-tt-storage]').textContent = 'Shranjeno v tem brskalniku. Za drugo napravo uporabite kopijo JSON. Izvoz ICS ohrani lokalni čas v Sloveniji.'; }
    catch { $('[data-tt-storage]').textContent = 'Shramba brskalnika ni na voljo. Pred odhodom shranite kopijo JSON; trenutni vnosi ostanejo v tem odprtem zavihku.'; }
  }
  function syncSettings() { $$('[data-tt-setting]').forEach(input => input.type === 'checkbox' ? input.checked = plan[input.dataset.ttSetting] : input.value = plan[input.dataset.ttSetting]); }
  function lessonHTML(lesson, editable = true) {
    return `<article class="tt-lesson"><time>${lesson.startTime}–${lesson.endTime}</time><strong>${escapeHTML(lesson.subject)}</strong>${lesson.room ? `<small>Učilnica ${escapeHTML(lesson.room)}</small>` : ''}${lesson.teacher ? `<small>${escapeHTML(lesson.teacher)}</small>` : ''}${lesson.legacyPerson ? `<small>Oseba iz prejšnjega vnosa: ${escapeHTML(lesson.legacyPerson)}</small>` : ''}${editable ? `<button type="button" data-tt-edit="${lesson.id}" aria-label="Uredi: ${escapeHTML(lesson.subject)}">Uredi</button>` : ''}</article>`;
  }
  function weekHTML(editable = true) {
    const length = plan.lessons.some(l => l.day === 7) ? 7 : plan.lessons.some(l => l.day === 6) ? 6 : 5;
    return { length, html: Array.from({ length }, (_, i) => { const date = addDays(week, i); const lessons = occurrences.filter(l => l.date === date); const breakDay = plan.skipBreaks && data.events.find(e => e.level === plan.level && (!e.region || e.region === plan.region) && e.start <= date && e.end >= date);
      return `<section class="tt-day"><h3>${DAYS[i]}<span>${formatDate(date)}</span></h3><div class="tt-day-list">${lessons.length ? lessons.map(l => lessonHTML(l, editable)).join('') : `<p class="tt-day-empty">${date < plan.from || date > plan.to ? 'Zunaj obdobja urnika.' : breakDay ? escapeHTML(breakDay.title) : 'Ni učnih ur.'}</p>`}</div></section>`;
    }).join('') };
  }
  function render() {
    occurrences = lessonOccurrences(plan, data); syncSettings(); $('[data-tt-title]').textContent = [plan.title, plan.className].filter(Boolean).join(' · ');
    $('[data-tt-week]').value = week; $('[data-tt-week-label]').textContent = `${formatDate(week)}–${formatDate(addDays(week, 6))} · Europe/Ljubljana`;
    const board = weekHTML(); $('[data-tt-board]').innerHTML = board.html; $('[data-tt-board]').classList.toggle('has-saturday', board.length === 6); $('[data-tt-board]').classList.toggle('has-sunday', board.length === 7);
    const inWeek = occurrences.filter(l => l.date >= week && l.date <= addDays(week, 6)); $('[data-tt-lesson-count]').textContent = plan.lessons.length; $('[data-tt-occurrence-count]').textContent = occurrences.length; $('[data-tt-week-count]').textContent = inWeek.length;
    $('[data-tt-lesson-count]').parentElement.lastChild.textContent = ` ${plural(plan.lessons.length,{one:'vnos',two:'vnosa',few:'vnosi',other:'vnosov'})} v urniku`;
    $('[data-tt-occurrence-count]').parentElement.lastChild.textContent = ` ${plural(occurrences.length,{one:'izvedba',two:'izvedbi',few:'izvedbe',other:'izvedb'})} v obdobju`;
    $('[data-tt-week-count]').parentElement.lastChild.textContent = ` ${plural(inWeek.length,{one:'ura',two:'uri',few:'ure',other:'ur'})} v prikazanem tednu`;
    const conflicts = findConflicts(inWeek); const conflictBox = $('[data-tt-conflicts]'); conflictBox.hidden = conflicts.length === 0;
    conflictBox.innerHTML = conflicts.length ? `<strong>Prekrivanja v prikazanem tednu: ${conflicts.length}</strong><ul>${conflicts.slice(0, 10).map(c => `<li>${formatDate(c.date)} · ${escapeHTML(c.first.subject)} (${c.first.startTime}–${c.first.endTime}) / ${escapeHTML(c.second.subject)} (${c.second.startTime}–${c.second.endTime})</li>`).join('')}</ul>${conflicts.length > 10 ? '<p>Prikazanih je prvih 10 prekrivanj.</p>' : ''}` : '';
    $('[data-tt-lessons]').innerHTML = plan.lessons.length ? `<table class="tt-lessons-table"><thead><tr><th>Dan in ura</th><th>Predmet</th><th>Ponavljanje</th><th><span class="sr-only">Urejanje</span></th></tr></thead><tbody>${[...plan.lessons].sort((a, b) => a.day - b.day || a.startTime.localeCompare(b.startTime)).map(l => `<tr><td>${DAYS[l.day - 1]}<br>${l.startTime}–${l.endTime}</td><td><strong>${escapeHTML(l.subject)}</strong><small>${escapeHTML([l.room && 'Učilnica ' + l.room, l.teacher].filter(Boolean).join(' · '))}</small></td><td>${l.repeat === 'weekly' ? 'Vsak teden' : formatDate(l.date)}</td><td><button type="button" data-tt-edit="${l.id}">Uredi</button> <button type="button" data-tt-remove="${l.id}" aria-label="Odstrani: ${escapeHTML(l.subject)}">Odstrani</button></td></tr>`).join('')}</tbody></table>` : '<p class="tt-storage-note">Še ni učnih ur. Najprej dodajte predmet v obrazcu.</p>';
    $('[data-tt-ics]').disabled = occurrences.length === 0; $('[data-tt-print]').disabled = inWeek.length === 0;
    $('[data-tt-prev]').disabled = addDays(week, -1) < plan.from; $('[data-tt-next]').disabled = addDays(week, 7) > plan.to;
  }
  function syncRepeatFields() {
    const once = form.elements.repeat.value === 'once';
    $('[data-tt-once]').hidden = !once;
    form.elements.day.disabled = once;
    form.elements.date.disabled = !once;
    form.elements.date.required = once;
    if (once && !validDate(form.elements.date.value)) form.elements.date.value = week < plan.from ? plan.from : week;
  }
  function resetLesson() { form.reset(); form.elements.id.value = ''; form.elements.date.value = week < plan.from ? plan.from : week; syncRepeatFields(); $('[data-tt-submit]').textContent = 'Dodaj učno uro'; $('[data-tt-cancel]').hidden = true; $('[data-tt-error]').textContent = ''; }
  form.addEventListener('change', event => { if (event.target.name === 'repeat') syncRepeatFields(); });
  form.addEventListener('submit', event => {
    event.preventDefault(); try { const values = Object.fromEntries(new FormData(form)); const previous = plan.lessons.find(l => l.id === values.id); const lesson = validateLesson({ ...previous, ...values }); const existing = Boolean(previous); const lessons = existing ? plan.lessons.map(l => l.id === lesson.id ? lesson : l) : [...plan.lessons, lesson];
      plan = validatePlan({ ...plan, lessons }); save(); resetLesson(); if (lesson.repeat === 'once') week = mondayOf(lesson.date); render();
      toast(occurrences.some(row => row.id === lesson.id) ? (existing ? 'Učna ura je posodobljena.' : 'Učna ura je dodana.') : 'Vnos je shranjen, vendar nima izvedbe v izbranem obdobju. Preverite datum in izpuščanje počitnic.');
    } catch (error) { $('[data-tt-error]').textContent = error.message; }
  });
  $$('[data-tt-setting]').forEach(input => input.addEventListener('change', () => {
    const settings = Object.fromEntries($$('[data-tt-setting]').map(el => [el.dataset.ttSetting, el.type === 'checkbox' ? el.checked : el.value]));
    try { plan = validatePlan({ ...plan, ...settings }); if (addDays(week, 6) < plan.from || week > plan.to) week = mondayOf(plan.from); save(); render(); $('[data-tt-error]').textContent = ''; } catch (error) { syncSettings(); $('[data-tt-error]').textContent = error.message; toast(error.message); }
  }));
  $('[data-tt-week]').addEventListener('change', event => { if (validDate(event.target.value)) { week = mondayOf(event.target.value); render(); } });
  root.addEventListener('click', event => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.hasAttribute('data-tt-cancel')) resetLesson();
    if (button.hasAttribute('data-tt-prev')) { week = addDays(week, -7); render(); }
    if (button.hasAttribute('data-tt-next')) { week = addDays(week, 7); render(); }
    if (button.hasAttribute('data-tt-edit')) {
      const lesson = plan.lessons.find(l => l.id === button.dataset.ttEdit); if (!lesson) return;
      for (const [key, value] of Object.entries(lesson)) if (form.elements.namedItem(key)) form.elements.namedItem(key).value = value;
      syncRepeatFields(); $('[data-tt-submit]').textContent = 'Shrani spremembe'; $('[data-tt-cancel]').hidden = false; form.elements.subject.focus();
    }
    if (button.hasAttribute('data-tt-remove')) { const removed = plan.lessons.find(l => l.id === button.dataset.ttRemove); if (!removed) return; plan.lessons = plan.lessons.filter(l => l.id !== removed.id); save(); render(); if (form.elements.id.value === removed.id) resetLesson(); const box = $('[data-tt-toast]'); box.replaceChildren(document.createTextNode(`Odstranjeno: ${removed.subject}. `)); const undo = document.createElement('button'); undo.type = 'button'; undo.textContent = 'Razveljavi'; undo.addEventListener('click', () => { if (!plan.lessons.some(l => l.id === removed.id)) plan.lessons.push(removed); save(); render(); box.hidden = true; }); box.append(undo); box.hidden = false; clearTimeout(box.hideTimer); }
    if (button.hasAttribute('data-tt-backup')) download(JSON.stringify(plan, null, 2), 'koledar365-solski-urnik.json', 'application/json;charset=utf-8');
    if (button.hasAttribute('data-tt-legacy-download') && legacy) download(JSON.stringify(legacy, null, 2), 'koledar365-prejsnji-solski-planer.json', 'application/json;charset=utf-8');
    if (button.hasAttribute('data-tt-ics')) { try { download(buildTimetableICS(plan, data), 'koledar365-solski-urnik.ics', 'text/calendar;charset=utf-8'); toast(`Koledar vsebuje ${occurrences.length} izvedb. Spremembe urnika zahtevajo nov izvoz.`); } catch (error) { toast(error.message); } }
    if (button.hasAttribute('data-tt-print')) {
      const board = weekHTML(false); $('[data-tt-print-sheet]').innerHTML = `<header><span>KOLEDAR365 · ŠOLSKI URNIK</span><h1>${escapeHTML([plan.title, plan.className].filter(Boolean).join(' · '))}</h1><p>${formatDate(week)}–${formatDate(addDays(week, 6))} · čas v Sloveniji</p></header><div class="tt-week-board ${board.length === 6 ? 'has-saturday' : board.length === 7 ? 'has-sunday' : ''}">${board.html}</div><footer>Osebni razpored · ${plan.skipBreaks ? 'Uradne počitnice in prazniki 2026/2027 so izpuščeni.' : 'Počitnice niso samodejno izpuščene.'}<br>koledar365.si/solski-urnik/</footer>`; document.body.classList.add('education-printing'); window.print();
    }
  });
  $('[data-tt-import]').addEventListener('change', async event => {
    try {
      const file = event.target.files?.[0]; if (!file) return; if (file.size > 1000000) throw new Error('Izberite kopijo do 1 MB.');
      const raw = JSON.parse(await file.text()); const imported = raw.schema ? validatePlan(raw) : migrateLegacy(raw);
      const dialog = document.createElement('dialog'); dialog.className = 'tt-import-dialog'; dialog.innerHTML = `<h2>Odpri shranjeni urnik?</h2><p><strong>${escapeHTML(imported.title)}</strong><br>${imported.lessons.length} vnosov · ${formatDate(imported.from)}–${formatDate(imported.to)}</p><p>Ta kopija bo zamenjala trenutni urnik v tem brskalniku.</p><div class="tt-actions"><button type="button" data-save-current>Shrani trenutni urnik</button><button type="button" class="ed-primary" data-accept>Zamenjaj urnik</button><button type="button" data-cancel>Prekliči</button></div>`; document.body.append(dialog);
      dialog.querySelector('[data-save-current]').addEventListener('click', () => download(JSON.stringify(plan, null, 2), 'koledar365-solski-urnik-pred-uvozom.json', 'application/json;charset=utf-8'));
      dialog.querySelector('[data-accept]').addEventListener('click', () => { plan = imported; week = mondayOf(plan.from); save(); resetLesson(); render(); dialog.close(); toast('Kopija je odprta.'); });
      dialog.querySelector('[data-cancel]').addEventListener('click', () => dialog.close()); dialog.addEventListener('close', () => dialog.remove()); dialog.showModal();
    } catch (error) { toast(error.message); } finally { event.target.value = ''; }
  });
  root.addEventListener('k365:copy-weekly-lessons', event => {
    try {
      const incoming = event.detail.lessons.map(validateLesson);
      const signature = lesson => [lesson.subject, lesson.day, lesson.startTime, lesson.endTime, lesson.room, lesson.teacher, lesson.repeat, lesson.date].join('\u0001');
      const existing = new Set(plan.lessons.map(signature));
      const ids = new Set(plan.lessons.map(lesson => lesson.id));
      const additions = [];
      for (const lesson of incoming) {
        if (existing.has(signature(lesson))) continue;
        existing.add(signature(lesson));
        if (ids.has(lesson.id)) lesson.id = uid();
        ids.add(lesson.id); additions.push(lesson);
      }
      const next = validatePlan({ ...plan, lessons: [...plan.lessons, ...additions] });
      plan = next; save(); render();
      event.detail.report(additions.length ? `Dodano učnih ur: ${additions.length}. Obstoječi vnosi in tedenski planer so ohranjeni.` : 'Vsi predmeti so že v obdobnem urniku. Podvojenih vnosov nismo dodali.');
    } catch (error) { event.detail.report(error.message); }
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('education-printing'));
  syncRepeatFields(); $('[data-tt-submit]').disabled = false; $('[data-tt-backup]').disabled = false; render();
}
if (typeof document !== 'undefined') { const root = document.querySelector('[data-school-timetable]'); if (root) initTimetable(root); }
