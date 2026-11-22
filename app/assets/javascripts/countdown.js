'use strict';

(() => {
  const root = document.querySelector('[data-countdown-root]');
  if (!root) return;

  const get = (selector, within = root) => within.querySelector(selector);
  const all = (selector, within = root) => [...within.querySelectorAll(selector)];
  const picker = get('[data-event-picker]');
  const tabs = all('[data-event-filter]');
  const eventSelect = get('[data-event-select]');
  const search = get('[data-event-search]');
  const yearSelect = get('[data-event-year]');
  const schoolLevel = get('[data-school-level]');
  const schoolRegion = get('[data-school-region]');
  const eventTime = get('[data-event-time]');
  const eventBoundary = get('[data-event-boundary]');
  const customForm = get('[data-custom-form]');
  const display = get('[data-feature-card]');
  const featureHeading = get('[data-feature-title]');
  const featureSave = get('[data-feature-save]');
  const featureShare = get('[data-feature-share]');
  const featureNotice = get('[data-feature-notice]');
  const shareField = get('[data-share-field]');
  const shareInput = get('[data-share-url]');

  const STORAGE_KEY = 'k365.countdowns.v1';
  const REGION_KEY = 'k365.countdowns.region';
  const SLOVENIAN_ZONE = 'Europe/Ljubljana';
  const zones = new Map([...customForm.elements.zone.options].map(option => [option.value, option.text]));
  const categoryNames = {
    holiday: 'Slovenski praznik',
    festival: 'Festival ali prireditev',
    observance: 'Poseben dan',
    school: 'Šolski termin',
    custom: 'Osebni datum'
  };
  const searchExamples = { holiday: 'Božič', festival: 'Ljubljana', observance: 'Pust', school: 'počitnice' };
  const units = ['days', 'hours', 'minutes', 'seconds'];
  const DAY = 86400000;
  const dateLabels = new Intl.DateTimeFormat('sl-SI', { timeZone: 'UTC', dateStyle: 'long' });
  const shortDateLabels = new Intl.DateTimeFormat('sl-SI', { timeZone: 'UTC', dateStyle: 'medium' });
  const shortMonth = new Intl.DateTimeFormat('sl-SI', { timeZone: 'UTC', month: 'short' });
  const localDates = new Intl.DateTimeFormat('sv-SE', { timeZone: SLOVENIAN_ZONE, dateStyle: 'short' });
  const localDate = () => localDates.format(Date.now());
  const zoneFormatters = new Map();
  const validTime = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value || '');
  const fold = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('sl');
  const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };

  function dateMs(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01') return NaN;
    const date = new Date(value + 'T00:00:00Z');
    return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value ? +date : NaN;
  }

  const validDate = value => Number.isFinite(dateMs(value));
  const afterDay = date => new Date(dateMs(date) + DAY).toISOString().slice(0, 10);
  const formatDate = (date, formatter = dateLabels) => formatter.format(dateMs(date));
  const rangeLabel = entry => entry.end_date
    ? `${formatDate(entry.date)} – ${formatDate(entry.end_date)}`
    : formatDate(entry.date);

  function wallClockMs(instant, zone) {
    if (!zoneFormatters.has(zone)) {
      zoneFormatters.set(zone, new Intl.DateTimeFormat('en-GB', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }));
    }
    const parts = Object.fromEntries(zoneFormatters.get(zone).formatToParts(instant).map(part => [part.type, Number(part.value)]));
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  }

  function instantAt(date, time, zone) {
    if (!validDate(date) || !validTime(time) || !zones.has(zone)) return null;

    const requested = Date.parse(date + 'T' + time + ':00Z');
    // Inspect both sides of a possible clock change. Matching no offset means the
    // wall time was skipped. Matching two offsets means we use the first occurrence.
    const candidates = [requested - DAY, requested, requested + DAY].map(sample =>
      requested - (wallClockMs(sample, zone) - sample)
    ).filter(instant => wallClockMs(instant, zone) === requested);
    return candidates.length ? Math.min(...candidates) : null;
  }

  function readEvents() {
    try {
      const data = JSON.parse(get('[data-countdown-events]').textContent);
      return data.filter(event => validDate(event.date) && Object.hasOwn(categoryNames, event.category))
        .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, 'sl'));
    } catch {
      return [];
    }
  }

  const events = readEvents();
  const eventMap = new Map(events.map(event => [event.id, event]));

  function storedString(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }

  function storeString(key, value) {
    try { localStorage.setItem(key, value); return true; } catch { return false; }
  }

  function cleanEntry(value) {
    if (!value || typeof value.title !== 'string' || !value.title.trim() || !value.id) return null;
    if (!validDate(value.date) || !validTime(value.time) || !zones.has(value.zone)) return null;

    const endDate = validDate(value.end_date) && value.end_date > value.date ? value.end_date : null;
    return {
      id: String(value.id).slice(0, 180),
      event_id: typeof value.event_id === 'string' ? value.event_id : null,
      title: value.title.trim().slice(0, 130),
      date: value.date,
      end_date: endDate,
      time: value.time,
      zone: value.zone,
      boundary: endDate && value.boundary === 'end' ? 'end' : 'start',
      category: Object.hasOwn(categoryNames, value.category) ? value.category : 'custom',
      detail: typeof value.detail === 'string' ? value.detail.slice(0, 330) : '',
      all_day: value.all_day === true,
      provisional: value.provisional === true
    };
  }

  function entryDate(entry) {
    return entry.boundary === 'end' ? afterDay(entry.end_date) : entry.date;
  }

  function entryInstant(entry) {
    return instantAt(entryDate(entry), entry.time, entry.zone);
  }

  function readSaved() {
    try {
      const items = JSON.parse(storedString(STORAGE_KEY));
      if (Array.isArray(items)) return items.map(cleanEntry).filter(Boolean).slice(0, 50);
    } catch { /* A damaged local list can be replaced by the next save. */ }
    return [];
  }

  const saved = readSaved();
  let savedTimers = [];
  let active = null;
  let category = 'holiday';
  schoolRegion.value = storedString(REGION_KEY) === 'east' ? 'east' : 'west';
  schoolLevel.value = storedString(REGION_KEY + '.level') === 'secondary' ? 'secondary' : 'primary';

  function calendarEntry(event, boundary = 'start', time = '00:00') {
    const endsLater = Boolean(event.end_date && event.end_date > event.date);
    const useEnd = endsLater && boundary === 'end';
    return cleanEntry({
      ...event, event_id: event.id, zone: SLOVENIAN_ZONE,
      id: useEnd ? event.id + ':end' : time === '00:00' ? event.id : event.id + ':' + time,
      time: useEnd ? '00:00' : time, boundary: useEnd ? 'end' : 'start',
      all_day: useEnd || time === '00:00'
    });
  }

  function defaultEntry(event) {
    const start = calendarEntry(event);
    if (event.end_date && entryInstant(start) <= Date.now()) return calendarEntry(event, 'end');
    return start;
  }

  function upcoming(kind) {
    const today = localDate();
    return events.filter(event => event.category === kind && (event.end_date || event.date) >= today).filter(event =>
      kind !== 'school' ||
        ((!event.region || ['all', schoolRegion.value].includes(event.region)) &&
        (!event.school_level || ['all', schoolLevel.value].includes(event.school_level)))
    );
  }

  function firstFuture(kind) {
    const today = localDate();
    const future = upcoming(kind).filter(event => event.date > today);
    return (kind === 'holiday' && future.find(event => event.work_free)) || future[0];
  }

  function configureCategory(kind) {
    category = kind;
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.eventFilter === kind)));
    picker.hidden = kind === 'custom';
    customForm.hidden = kind !== 'custom';
    get('[data-region-control]').hidden = kind !== 'school';
    search.value = '';
    if (!picker.hidden) search.placeholder = 'npr. ' + searchExamples[kind];
    updateYears();
  }

  function updateYears() {
    const years = [...new Set(upcoming(category).map(event => event.date.slice(0, 4)))];
    yearSelect.replaceChildren(new Option('Vsa leta', 'all'), ...years.map(year => new Option(year, year)));
  }

  function describeEvent(event) {
    const parts = [shortDateLabels.format(dateMs(event.date))];
    if (event.end_date) parts[0] += ' – ' + shortDateLabels.format(dateMs(event.end_date));
    if (event.category === 'festival' && event.detail) parts.push(event.detail);
    if (event.provisional) parts.push('Predviden termin');
    return event.title + ' · ' + parts.join(' · ');
  }

  function renderOptions(selectedId = '') {
    const words = fold(search.value.trim()).split(/\s+/).filter(Boolean);
    const year = yearSelect.value;
    const matches = upcoming(category).filter(event => {
      const searchable = fold([event.title, event.detail, event.date, formatDate(event.date)].filter(Boolean).join(' '));
      return (year === 'all' || event.date.startsWith(year)) && words.every(word => searchable.includes(word));
    });
    eventSelect.replaceChildren(
      new Option(matches.length ? 'Izberite dogodek' : 'Ni zadetkov', ''),
      ...matches.map(event => new Option(describeEvent(event), event.id))
    );
    eventSelect.disabled = matches.length === 0;
    eventSelect.value = matches.some(event => event.id === selectedId) ? selectedId : '';
    const showCount = words.length > 0 || year !== 'all';
    setText(get('[data-event-note]'), matches.length
      ? showCount ? `Število datumov: ${matches.length}` : ''
      : 'Poskusite z drugim iskanjem, letom ali kategorijo.');
    updateEventSettings();
  }

  const timerElements = units.map(unit => get(`[data-feature-${unit}]`));

  function updateEventSettings() {
    const event = eventMap.get(eventSelect.value);
    const entry = active?.entry;
    const showingEvent = Boolean(event && entry?.event_id === event.id);
    get('[data-event-settings]').hidden = !showingEvent;
    if (!showingEvent) {
      setText(get('[data-time-note]'), '');
      return;
    }

    const hasRange = Boolean(event.end_date && event.end_date > event.date);
    get('[data-event-boundary-wrap]').hidden = !hasRange;
    eventBoundary.value = entry.boundary;
    eventTime.value = entry.boundary === 'end' ? '00:00' : entry.time;
    get('[data-event-time-wrap]').hidden = entry.boundary === 'end';
    setText(get('[data-time-note]'), entry.boundary === 'end'
      ? 'Cilj je polnoč po zadnjem dnevu dogodka.'
      : 'Uro lahko spremenite. Velja slovenski čas.');
  }

  function revealTimer(force = false) {
    if (!force && !matchMedia('(max-width: 820px)').matches) return;
    featureHeading.focus({ preventScroll: true });
    display.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function setActive(value, { reveal = false } = {}) {
    const entry = cleanEntry(value);
    if (!entry) return false;
    const instant = entryInstant(entry);
    if (instant === null) return false;

    const event = eventMap.get(entry.event_id || entry.id);
    if (event) entry.event_id = event.id;
    active = {
      entry,
      instant,
      began: entry.end_date ? instantAt(entry.date, '00:00', entry.zone) : null,
      ends: entry.end_date ? instantAt(afterDay(entry.end_date), '00:00', entry.zone) : null,
      targetLabel: `${formatDate(entryDate(entry))} ob ${entry.time}`
    };
    display.dataset.category = entry.category;
    shareField.hidden = true;
    setText(featureNotice, '');

    setText(featureHeading, entry.title);
    setText(get('[data-feature-zone]'), zones.get(entry.zone));
    const categoryLabel = event?.category === 'holiday'
      ? event.work_free ? 'Dela prosti praznik' : 'Praznik · ni dela prost dan'
      : categoryNames[entry.category];
    setText(get('[data-feature-category]'), categoryLabel);
    setText(get('[data-feature-date]'), `${rangeLabel(entry)}${entry.end_date ? '' : ' ob ' + entry.time}`);
    const venue = get('[data-feature-venue]');
    venue.hidden = !(entry.category === 'festival' && event?.detail);
    if (!venue.hidden) setText(venue, event.detail);
    const source = get('[data-feature-source]');
    const sourcePath = event?.path || event?.source_url;
    source.hidden = !sourcePath;
    if (sourcePath) source.href = sourcePath;

    featureShare.disabled = false;
    updateSaveButton();
    updateEventSettings();
    tick();
    if (reveal) revealTimer(reveal === 'always');
    return true;
  }

  function updateSaveButton() {
    const alreadySaved = active && saved.some(entry => entry.id === active.entry.id);
    featureSave.disabled = !active || alreadySaved;
    setText(get('[data-save-label]'), alreadySaved ? 'Shranjeno' : 'Shrani');
  }

  const pad = n => String(n).padStart(2, '0');

  function writeTimer(instant, slots, now) {
    if (instant === null) return;
    const total = Math.max(0, Math.ceil((instant - now) / 1000));
    const values = [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60];
    slots[0].toggleAttribute('data-long', values[0] >= 1000);
    slots.forEach((slot, index) => setText(slot, pad(values[index])));
  }

  function tick() {
    const now = Date.now();
    if (active) {
      const { entry, instant, began, ends, targetLabel } = active;
      const finished = instant <= now;
      const current = began !== null && ends !== null && began <= now && now < ends;
      writeTimer(instant, timerElements, now);
      display.dataset.state = current ? 'ongoing' : finished ? 'finished' : 'pending';
      setText(get('[data-feature-state]'), current ? 'Dogodek poteka' : finished ? 'Čas je potekel' : 'Odštevanje');
      const status = current && finished ? 'Dogodek se je začel. Za odštevanje izberite konec zadnjega dne.'
        : entry.provisional ? 'Predviden šolski termin'
        : entry.boundary === 'end' ? `Konec zadnjega dne · ${targetLabel}`
        : entry.end_date ? `Začetek · ${targetLabel}`
        : '';
      setText(get('[data-feature-status]'), status);
    }
    savedTimers.forEach(timer => writeTimer(timer.instant, timer.slots, now));
  }

  function chooseCalendarEvent(event, settings = {}) {
    if (!event) return;
    configureCategory(event.category);
    if (event.category === 'school') {
      if (['primary', 'secondary'].includes(event.school_level)) schoolLevel.value = event.school_level;
      if (['east', 'west'].includes(event.region)) schoolRegion.value = event.region;
      updateYears();
    }
    renderOptions(event.id);
    setActive(settings.entry || defaultEntry(event), { reveal: settings.reveal });
  }

  function updateNext() {
    const list = get('.countdown-next__list');
    const dates = [];
    all('[data-next-item]', list).forEach(item => {
      const button = get('[data-next-event]', item);
      const event = firstFuture(button.dataset.nextEvent);
      item.hidden = !event;
      button.dataset.eventId = event?.id || '';
      if (!event) return;

      dates.push({ item, date: event.date });
      const date = get('[data-next-date]', button);
      date.dateTime = event.date;
      setText(get('[data-next-day]', date), String(Number(event.date.slice(8))));
      setText(get('[data-next-month]', date), shortMonth.format(dateMs(event.date)));
      setText(get('[data-next-year]', date), event.date.slice(0, 4));
      setText(get('[data-next-name]', button), event.title);
      const context = get('[data-next-context]', button);
      const place = event.category === 'festival' ? event.detail : null;
      context.hidden = !place;
      setText(context, place || '');
    });
    dates.sort((a, b) => a.date.localeCompare(b.date));
    list.append(...dates.map(slot => slot.item));
    get('[data-next-section]').hidden = dates.length === 0;
  }

  const node = (tag, className = '', label) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (label !== undefined) element.textContent = label;
    return element;
  };

  function renderSaved() {
    const list = get('[data-saved-list]');
    list.replaceChildren();
    savedTimers = [];
    const hasSaved = saved.length > 0;
    get('[data-saved-empty]').hidden = hasSaved;
    const exportButton = get('[data-export-ics]');
    exportButton.disabled = !hasSaved;
    exportButton.hidden = !hasSaved;

    saved.forEach((entry, index) => {
      const card = node('article', 'countdown-saved-card');
      const title = node('h3', '', entry.title);
      const goal = node('p', '', `${formatDate(entryDate(entry))} ob ${entry.time} · ${zones.get(entry.zone)}`);
      const timer = node('div', 'countdown-saved-card__clock');
      timer.setAttribute('role', 'timer');
      timer.setAttribute('aria-live', 'off');
      timer.setAttribute('aria-label', 'Preostali čas');
      const slots = ['dni', 'ur', 'min', 'sek'].map(label => {
        const item = node('div');
        const value = node('strong', '', '—');
        item.append(value, node('span', '', label));
        timer.append(item);
        return value;
      });
      savedTimers.push({ slots, instant: entryInstant(entry) });

      const actions = node('div', 'countdown-saved-card__actions');
      const load = node('button', 'countdown-link', 'Prikaži');
      load.type = 'button';
      load.addEventListener('click', () => {
        const event = eventMap.get(entry.event_id || entry.id);
        if (event) chooseCalendarEvent(event, { entry });
        else showCustom(entry);
        featureHeading.focus({ preventScroll: true });
        display.scrollIntoView({ block: 'start' });
      });
      const remove = node('button', 'countdown-link countdown-remove', 'Odstrani');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Odstrani ${entry.title}`);
      remove.addEventListener('click', () => {
        saved.splice(index, 1);
        const persisted = storeString(STORAGE_KEY, JSON.stringify(saved));
        renderSaved();
        updateSaveButton();
        setText(get('[data-saved-status]'), persisted ? 'Odštevanje je odstranjeno.' : 'Spremembe ni mogoče shraniti v brskalnik.');
        const nextControl = all('.countdown-remove', list)[index] || get('.countdown-remove', list) || get('#countdown-saved-title');
        nextControl.focus();
      });

      actions.append(load, remove);
      card.append(title, goal, timer, actions);
      list.append(card);
    });
    tick();
  }

  featureSave.addEventListener('click', () => {
    if (!active || saved.some(entry => entry.id === active.entry.id)) return;
    if (saved.length >= 50) {
      setText(featureNotice, 'Seznam je poln. Pred shranjevanjem odstranite en datum.');
      return;
    }
    saved.unshift(active.entry);
    const persisted = storeString(STORAGE_KEY, JSON.stringify(saved));
    renderSaved();
    updateSaveButton();
    setText(featureNotice, persisted ? 'Odštevanje je shranjeno.' : 'Brskalnik ni dovolil trajnega shranjevanja.');
  });

  featureShare.addEventListener('click', async () => {
    if (!active) return;
    const { entry } = active;
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('date', entryDate(entry));
    url.searchParams.set('time', entry.time);
    url.searchParams.set('zone', entry.zone);
    url.searchParams.set('title', entry.title);
    const eventId = entry.event_id || (eventMap.has(entry.id) ? entry.id : null);
    if (eventId) {
      url.searchParams.set('event', eventId);
      if (entry.boundary === 'end') url.searchParams.set('target', 'end');
    }

    shareInput.value = url.href;
    shareField.hidden = false;
    try {
      await navigator.clipboard.writeText(url.href);
      if (active?.entry.id === entry.id) setText(featureNotice, 'Povezava je kopirana.');
    } catch {
      if (active?.entry.id !== entry.id) return;
      setText(featureNotice, 'Kopirajte povezavo iz prikazanega polja.');
      shareInput.select();
    }
  });

  const escapeIcs = value => value.replace(/[\\;,]/g, match => '\\' + match).replace(/\r?\n/g, '\\n');
  const dateIcs = value => value.replace(/-/g, '');
  const utcIcs = value => new Date(value).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

  get('[data-export-ics]').addEventListener('click', () => {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Koledar365//Odstevanje//SL', 'CALSCALE:GREGORIAN'];
    saved.forEach(entry => {
      const instant = entryInstant(entry);
      if (instant === null) return;
      lines.push('BEGIN:VEVENT', `UID:${encodeURIComponent(entry.id)}@koledar365.si`, `DTSTAMP:${utcIcs(Date.now())}`);
      if (entry.all_day) {
        lines.push(`DTSTART;VALUE=DATE:${dateIcs(entry.date)}`, `DTEND;VALUE=DATE:${dateIcs(afterDay(entry.end_date || entry.date))}`);
      } else {
        lines.push(`DTSTART:${utcIcs(instant)}`, `DTEND:${utcIcs(instant + 3600000)}`);
      }
      lines.push(`SUMMARY:${escapeIcs(entry.title)}`, `DESCRIPTION:${escapeIcs(entry.detail || 'Odštevanje na Koledar365.si')}`, 'END:VEVENT');
    });
    lines.push('END:VCALENDAR', '');
    globalThis.Calendar365Downloads.save(lines.join('\r\n'), 'koledar365-odstevanje.ics', 'text/calendar;charset=utf-8');
  });

  function showCustom(entry, reveal = false) {
    configureCategory('custom');
    const form = customForm.elements;
    form.title.value = entry.title;
    form.date.value = entryDate(entry);
    form.time.value = entry.time;
    form.zone.value = entry.zone;
    setActive(entry, { reveal });
  }

  function restoreShared() {
    const params = new URLSearchParams(location.search);
    const event = eventMap.get(params.get('event'));
    const time = params.get('time') || '00:00';
    if (event) {
      const selected = calendarEntry(event, params.get('target'), time);
      if (selected && entryInstant(selected) !== null) {
        chooseCalendarEvent(event, { entry: selected });
        return true;
      }
    }

    const date = params.get('date');
    const zone = params.get('zone') || SLOVENIAN_ZONE;
    const title = params.get('title');
    if (!title?.trim() || instantAt(date, time, zone) === null) return false;
    showCustom({ id: `shared-${date}-${time}-${zone}-${title.slice(0, 64)}`, title, date, time, zone, category: 'custom' });
    return true;
  }

  tabs.forEach(tab => tab.addEventListener('click', () => {
    const kind = tab.dataset.eventFilter;
    if (kind === category) return;
    configureCategory(kind);
    if (kind === 'custom') {
      customForm.elements.title.focus();
      return;
    }
    const first = firstFuture(kind) || upcoming(kind)[0];
    renderOptions(first?.id);
    if (first) setActive(defaultEntry(first));
  }));

  [search, yearSelect].forEach(control => control.addEventListener(control === search ? 'input' : 'change', () => {
    renderOptions(active?.entry.event_id);
  }));

  [
    [schoolLevel, REGION_KEY + '.level'],
    [schoolRegion, REGION_KEY]
  ].forEach(([control, key]) => control.addEventListener('change', () => {
    storeString(key, control.value);
    updateYears();
    const first = firstFuture('school') || upcoming('school')[0];
    renderOptions(first?.id);
    if (first) setActive(defaultEntry(first));
    updateNext();
  }));

  eventSelect.addEventListener('change', () => {
    const event = eventMap.get(eventSelect.value);
    if (event) setActive(defaultEntry(event), { reveal: true });
    else updateEventSettings();
  });

  [eventBoundary, eventTime].forEach(control => control.addEventListener('change', () => {
    const event = eventMap.get(eventSelect.value);
    if (!event) return;
    const selection = calendarEntry(event, eventBoundary.value, eventTime.value);
    if (!setActive(selection)) setText(get('[data-time-note]'), 'Izbrana ura ne obstaja. Izberite drugo uro.');
  }));

  customForm.addEventListener('submit', event => {
    event.preventDefault();
    const form = customForm.elements;
    const title = form.title.value.trim();
    const date = form.date.value;
    const time = form.time.value;
    const zone = form.zone.value;
    const status = get('[data-custom-status]');
    if (!title || !validDate(date) || !validTime(time) || !zones.has(zone)) {
      setText(status, 'Preverite ime, datum, uro in časovni pas.');
      return;
    }
    const id = `custom-${date}-${time}-${zone}-${title}`;
    if (!setActive({ id, title, date, time, zone, category: 'custom', detail: 'Osebni datum' }, { reveal: true })) {
      setText(status, 'Izbrana ura v tem časovnem pasu ne obstaja zaradi premika ure.');
      return;
    }
    setText(status, '');
  });

  all('[data-next-event]').forEach(button => button.addEventListener('click', () => {
    chooseCalendarEvent(eventMap.get(button.dataset.eventId), { reveal: 'always' });
  }));

  if (!restoreShared()) {
    const initial = firstFuture('holiday') || firstFuture('festival') || firstFuture('school') || firstFuture('observance');
    if (initial) chooseCalendarEvent(initial);
    else { configureCategory('holiday'); renderOptions(); }
  }
  if (category !== 'custom') {
    customForm.elements.date.value = afterDay(localDate());
    if (location.hash === '#moj-datum') {
      configureCategory('custom');
      requestAnimationFrame(() => customForm.scrollIntoView());
    }
  }
  updateNext();
  renderSaved();
  setInterval(tick, 1000);
  document.addEventListener('visibilitychange', tick);
})();
