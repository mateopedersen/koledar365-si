import { DAY, byDays, calendarDocument, civilDate, isoDate, pensionAmount, retirementPaths, studyPlan } from './local-tools-core.mjs';

const all = (root, selector) => [...root.querySelectorAll(selector)];
const dateFormat = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'long', timeZone: 'UTC' });
const shortFormat = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const calendarTime = new Intl.DateTimeFormat('sl-SI', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Ljubljana' });
const slToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Ljubljana', dateStyle: 'short' }).format(new Date());
const euro = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' });
const decimal = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 2, useGrouping: false });
const normalized = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('sl').trim();

function make(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}
const formValues = form => Object.fromEntries(new FormData(form));
const formatDate = text => dateFormat.format(civilDate(text));
const duration = minutes => [minutes >= 60 ? `${Math.floor(minutes / 60)} h` : '', minutes % 60 ? `${minutes % 60} min` : ''].filter(Boolean).join(' ') || '0 min';

function saveCalendar(button, entries, slug) {
  button.parentElement.querySelector('[data-export-message]')?.remove();
  try {
    globalThis.Calendar365Downloads.save(calendarDocument(entries), `koledar365-${slug}.ics`, 'text/calendar;charset=utf-8');
  } catch (err) {
    const status = make('p');
    status.dataset.exportMessage = '';
    status.setAttribute('role', 'status');
    status.textContent = err.message;
    button.after(status);
  }
}

function directory(root) {
  const search = root.querySelector('[data-tool-query]');
  const nav = all(root, '[data-tool-category]');
  const groups = all(root, '[data-tool-group]');
  let category = nav.find(link => link.hash === location.hash)?.dataset.toolCategory || 'all';
  const render = () => {
    const words = normalized(search.value).split(/\s+/).filter(Boolean);
    let total = 0;
    for (const section of groups) {
      let shown = 0;
      for (const card of all(section, '[data-tool-card]')) {
        const searchable = normalized([card.textContent, card.pathname.replace(/[/-]/g, ' '), card.dataset.toolKeywords].join(' '));
        card.hidden = !words.every(word => searchable.includes(word));
        if (!card.hidden) shown += 1;
      }
      section.hidden = (category !== 'all' && category !== section.dataset.toolGroup) || !shown;
      if (!section.hidden) total += shown;
    }
    for (const link of nav) {
      if (link.dataset.toolCategory === category) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    root.querySelector('[data-tool-count]').textContent = `Prikazana orodja: ${total}`;
    root.querySelector('[data-tool-empty]').hidden = total > 0;
  };
  search.addEventListener('input', () => { category = 'all'; render(); });
  for (const link of nav) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return;
      event.preventDefault();
      category = link.dataset.toolCategory;
      history.replaceState(null, '', link.hash);
      render();
      if (matchMedia('(max-width: 680px)').matches) {
        root.querySelector('[data-tool-count]').scrollIntoView({ block: 'nearest' });
      }
    });
  }
  render();
}

function filterRows(root) {
  for (const list of all(root, '[data-tool-list]')) {
    const search = list.querySelector('[data-row-search]');
    const year = list.querySelector('[data-row-year]');
    const category = list.querySelector('[data-row-category]');
    const rows = all(list, '[data-tool-row]');
    const empty = list.querySelector('[data-row-empty]');
    const stage = list.querySelector('[data-row-stage]');
    const countLabel = list.querySelector('[data-row-count]');
    if (stage) stage.disabled = false;
    const download = list.querySelector('[data-row-export]');
    const render = () => {
      const query = normalized(search?.value || '');
      let count = 0;
      for (const row of rows) {
        row.hidden = Boolean((year?.value && row.dataset.year !== year.value) ||
          (category?.value && row.dataset.category !== category.value) ||
          (stage?.value && row.dataset.stage !== stage.value) ||
          (query && !normalized(row.dataset.searchText || row.textContent).includes(query)));
        if (!row.hidden) count += 1;
      }
      if (empty) empty.hidden = count > 0;
      if (countLabel) countLabel.textContent = !stage || stage.value ? `${countLabel.dataset.rowCount || 'Prikazani termini'}: ${count}` : '';
      if (download) download.disabled = !count;
    };
    search?.addEventListener('input', render);
    year?.addEventListener('change', render);
    category?.addEventListener('change', render);
    stage?.addEventListener('change', render);
    download?.addEventListener('click', () => {
      const selected = rows.filter(row => !row.hidden).map(row => ({
        date: row.dataset.date, end: row.dataset.end, title: row.dataset.title,
        uid: `${root.dataset.tool}-${row.dataset.date}-${row.dataset.category}-${row.dataset.title}`,
        note: [row.querySelector('p')?.textContent, row.dataset.source].filter(Boolean).join('\n')
      }));
      saveCalendar(download, selected, root.dataset.tool);
    });
    render();
  }
}

function admissionsTracks(root) {
  const links = all(root, '[data-admission-track]');
  if (!links.length) return;
  const panels = all(root, '[data-admission-panel]');

  function activate(active) {
    for (const link of links) {
      if (link === active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
    for (const panel of panels) panel.hidden = '#' + panel.id !== active.hash;
  }

  for (const link of links) {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      history.replaceState(null, '', link.hash);
      activate(link);
    });
  }
  window.addEventListener('hashchange', () => {
    const linked = links.find(link => link.hash === location.hash);
    if (linked) activate(linked);
  });
  activate(links.find(link => link.hash === location.hash) || links[0]);
}

function reminders(root) {
  const panel = root.querySelector('[data-reminders]');
  if (!panel) return;
  const key = `koledar365.orodja.${panel.dataset.reminders}.v1`;
  const form = panel.querySelector('[data-reminder-form]');
  const list = panel.querySelector('[data-reminder-list]');
  const message = panel.querySelector('[data-reminder-message]');
  const download = panel.querySelector('[data-reminder-export]');
  let entries = [];
  try {
    const loaded = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(loaded)) entries = loaded.filter(row => row && civilDate(row.date) && typeof row.title === 'string' && typeof row.uid === 'string').slice(0, 100);
  } catch {}
  const persist = notice => {
    try {
      localStorage.setItem(key, JSON.stringify(entries));
      message.textContent = notice;
    } catch {
      message.textContent = 'Brskalnik ne dovoli shranjevanja. Opomnike lahko prenesete pred odhodom.';
    }
  };
  function render() {
    list.replaceChildren();
    entries.sort((a, b) => a.date.localeCompare(b.date));
    for (const entry of entries) {
      const row = make('li', '', 'tool-card-line');
      const date = make('time', formatDate(entry.date), 'tool-date-chip');
      date.dateTime = entry.date;
      const label = make('label', '', 'tool-check');
      const checkbox = make('input');
      checkbox.type = 'checkbox';
      checkbox.checked = Boolean(entry.done);
      label.append(checkbox, make('span', entry.title));
      checkbox.addEventListener('change', () => {
        entry.done = checkbox.checked;
        row.classList.toggle('is-done', entry.done);
        download.disabled = entries.every(item => item.done);
        persist(entry.done ? 'Označeno kot opravljeno.' : 'Znova odprto.');
      });
      const remove = make('button', 'Odstrani', 'tool-secondary');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Odstrani: ${entry.title}`);
      remove.addEventListener('click', () => {
        entries = entries.filter(row => row.uid !== entry.uid);
        persist('Opomnik je odstranjen.');
        render();
        form.elements.title.focus();
      });
      row.classList.toggle('is-done', Boolean(entry.done));
      row.append(date, label, remove);
      list.append(row);
    }
    download.disabled = entries.every(row => row.done);
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    const data = formValues(form);
    const title = data.title.trim();
    if (!title || !civilDate(data.date) || entries.length >= 100) {
      message.textContent = 'Vpišite ime in veljaven datum. Shranite lahko do 100 opomnikov.';
      return;
    }
    let uid = globalThis.crypto?.randomUUID?.();
    if (!uid) {
      const timestamp = Date.now();
      let suffix = 0;
      do { uid = `opomnik-${timestamp}-${suffix++}`; } while (entries.some(entry => entry.uid === uid));
    }
    entries.push({ title, date: data.date, uid, done: false });
    persist('Opomnik je dodan.');
    form.elements.title.value = '';
    render();
  });
  for (const button of all(root, '[data-reminder-pick]')) {
    button.disabled = false;
    button.addEventListener('click', () => {
      form.elements.title.value = button.dataset.name;
      if (civilDate(button.dataset.reminderDate)) form.elements.date.value = button.dataset.reminderDate;
      const monthDay = button.dataset.recurringDay;
      if (monthDay) {
        const today = slToday();
        let year = Number(today.slice(0, 4));
        if (`${year}-${monthDay}` < today) year += 1;
        form.elements.date.value = `${year}-${monthDay}`;
      }
      form.elements.title.focus();
      panel.scrollIntoView({ block: 'nearest' });
    });
  }
  download.addEventListener('click', () => saveCalendar(download, entries.filter(entry => !entry.done), 'opomniki-' + panel.dataset.reminders));
  render();
}

function pension(root) {
  const form = root.querySelector('[data-retirement-form]');
  const result = root.querySelector('[data-retirement-result]');
  const timeline = root.querySelector('[data-retirement-timeline]');
  const amount = root.querySelector('[data-pension-amount]');
  const amountResult = root.querySelector('[data-amount-result]');
  const progress = root.querySelector('[data-amount-progress]');
  form.addEventListener('submit', event => {
    event.preventDefault();
    timeline.replaceChildren();
    timeline.hidden = true;
    try {
      const paths = retirementPaths(formValues(form));
      if (!paths.length) throw new Error('V obdobju do leta 2130 ni izračunanega datuma z vnesenimi podatki.');
      const first = paths[0];
      const label = first.date < slToday() ? 'Pogoja bi bila že izpolnjena' : 'Najzgodnejši datum po vnosu';
      result.replaceChildren(make('span', label), make('strong', formatDate(first.date)));
      for (const path of paths) {
        const card = make('div');
        const years = Math.floor(path.ageMonths / 12);
        const months = path.ageMonths % 12;
        const criterion = path.minYears === 15 ? '15 let zavarovalne dobe' :
          path.date < '2035-01-01' ? '40 let dobe brez dokupa' : '40 let pokojninske dobe';
        card.append(make('strong', criterion + ' · ' + formatDate(path.date)),
          make('small', `Starostni pogoj za to leto: ${years} let${months ? ' in ' + months + (months === 3 ? ' mesece' : ' mesecev') : ''}. Doba: ${formatDate(path.serviceDate)}.`));
        timeline.append(card);
      }
      timeline.hidden = false;
    } catch (error) {
      result.textContent = error.message;
    }
  });
  root.querySelector('[data-pension-example]').addEventListener('click', () => {
    form.elements.birth.value = '1968-02-10';
    form.elements.years15.value = '2004-02-10';
    form.elements.years40.value = '2028-02-10';
    form.elements.years40all.value = '';
    form.requestSubmit();
    amount.elements.year.value = '2028';
    amount.elements.base.value = '1600';
    amount.elements.years.value = '40';
    amount.elements.months.value = '0';
    amount.requestSubmit();
  });
  amount.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const data = formValues(amount);
      const value = pensionAmount(+data.year, +data.base, +data.years, +data.months);
      amountResult.replaceChildren(make('span', 'Okvirni mesečni znesek'), make('strong', euro.format(value.amount)));
      progress.querySelector('span').style.width = Math.min(value.rate, 100) + '%';
      progress.querySelector('p').textContent = `Odmerni odstotek: ${decimal.format(value.rate)} %`;
      progress.hidden = false;
    } catch (error) {
      amountResult.textContent = error.message;
      progress.hidden = true;
    }
  });
}

function study(root) {
  const form = root.querySelector('[data-study-form]');
  const { start, end, title, hours, strategy, dailyMinutes, include } = form.elements;
  const weekdays = form.querySelector('[data-study-weekdays]');
  const result = root.querySelector('[data-study-result]');
  const details = root.querySelector('[data-study-details]');
  const bars = root.querySelector('[data-study-bars]');
  const sessions = root.querySelector('[data-study-sessions]');
  const download = root.querySelector('[data-study-ics]');
  const numericDate = new Intl.DateTimeFormat('sl-SI', {
    day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
  const sessionDate = new Intl.DateTimeFormat('sl-SI', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  });
  let entries = [];

  function notice(text, state) {
    result.textContent = text;
    result.dataset.state = state;
  }

  function resetResults() {
    entries = [];
    details.hidden = true;
    download.disabled = true;
  }

  form.addEventListener('input', () => {
    weekdays.hidden = weekdays.disabled = strategy.value !== 'custom';
    resetResults();
    notice('Za posodobitev urnika izberite »Sestavi načrt učenja«.', 'pending');
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    resetResults();
    try {
      const data = new FormData(form);
      const limit = dailyMinutes.value ? Number(dailyMinutes.value) : null;
      const plan = studyPlan({
        start: start.value, end: end.value, hours: Number(hours.value), strategy: strategy.value,
        include: include.checked, weekdays: data.getAll('weekday').map(Number), dailyMinutes: limit
      });
      const first = numericDate.format(civilDate(plan.days[0].date));
      const last = numericDate.format(civilDate(plan.days.at(-1).date));
      if (plan.scheduled < plan.target) {
        const pendingMinutes = plan.target - plan.scheduled;
        notice(`Od cilja ${duration(plan.target)} ostane brez termina ${duration(pendingMinutes)}. Za ta čas potrebujete dodatne učne dni: ${Math.ceil(pendingMinutes / limit)}.`, 'warning');
      } else {
        notice(first === last ? `Učni dan: ${first}.` : `Učni dnevi od ${first} do ${last}.`, 'ready');
      }
      root.querySelector('[data-study-days]').textContent = plan.days.length;
      root.querySelector('[data-study-average]').textContent = duration(Math.round(plan.scheduled / plan.days.length));
      root.querySelector('[data-study-total]').textContent = duration(plan.scheduled);

      const maximum = Math.max(...plan.weeks.map(week => week.minutes));
      bars.replaceChildren(...plan.weeks.map(week => {
        const row = make('li', '', 'tool-study-row');
        const label = make('time', 'Od ' + shortFormat.format(civilDate(week.first)));
        label.dateTime = week.first;
        const track = make('span', '', 'tool-study-track');
        const fill = make('i');
        fill.style.width = (week.minutes / maximum) * 100 + '%';
        track.setAttribute('aria-hidden', 'true');
        track.append(fill);
        row.append(label, track, make('strong', duration(week.minutes)));
        return row;
      }));
      sessions.replaceChildren(...plan.days.map(day => {
        const row = make('li');
        const date = make('time', sessionDate.format(civilDate(day.date)));
        date.dateTime = day.date;
        row.append(date, make('strong', duration(day.minutes)));
        return row;
      }));

      const name = title.value.trim();
      entries = plan.days.map(day => ({
        date: day.date,
        title: `${name || 'Učenje'} · ${duration(day.minutes)}`,
        uid: name ? `ucenje-${name}-${day.date}` : 'ucenje-' + day.date
      }));
      details.hidden = false;
      download.disabled = false;
    } catch (error) {
      notice(error.message, 'warning');
    }
  });

  root.querySelector('[data-study-example]').addEventListener('click', () => {
    start.value = '2027-06-07';
    end.value = '2027-06-15';
    title.value = 'Statistika';
    hours.value = '12';
    strategy.value = 'workweek';
    dailyMinutes.value = '';
    include.checked = false;
    weekdays.hidden = weekdays.disabled = true;
    form.requestSubmit();
  });
  download.addEventListener('click', () => {
    if (entries.length) saveCalendar(download, entries, 'nacrt-ucenja');
  });

  start.value = slToday();
  end.value = isoDate(byDays(civilDate(start.value), 14));
  form.requestSubmit();
}

async function moon(root) {
  const form = root.querySelector('[data-moon-form]');
  const status = root.querySelector('[data-moon-status]');
  const week = root.querySelector('[data-moon-week]');
  const axis = root.querySelector('[data-moon-axis]');
  const store = new Map();
  let version = 0;

  const showTime = value => value ? calendarTime.format(new Date(value)) : 'Ni prehoda';
  async function render() {
    const current = ++version;
    const data = formValues(form);
    status.textContent = 'Nalagam izračun …';
    week.replaceChildren();
    axis.hidden = true;
    for (const key of ['rise', 'set', 'light']) root.querySelector(`[data-moon-${key}]`).textContent = '–';
    try {
      if (!store.has(data.city)) {
        const request = fetch(`/calendar-tools/moonrise/${encodeURIComponent(data.city)}.json`).then(response => {
          if (!response.ok) throw new Error('Lunini časi trenutno niso dosegljivi.');
          return response.json();
        }).catch(error => { store.delete(data.city); throw error; });
        store.set(data.city, request);
      }
      const table = await store.get(data.city);
      if (current !== version) return;
      const date = civilDate(data.date);
      const offset = date ? (+date - +civilDate(table.first)) / DAY : -1;
      const day = table.days[offset];
      if (!day) throw new Error('Izberite datum med letoma 2026 in 2030.');
      root.querySelector('[data-moon-title]').textContent = `${form.elements.city.selectedOptions[0].textContent} · ${formatDate(data.date)}`;
      const [rise, set, light] = day;
      root.querySelector('[data-moon-rise]').textContent = showTime(rise);
      root.querySelector('[data-moon-set]').textContent = showTime(set);
      root.querySelector('[data-moon-light]').textContent = `${light} %`;
      for (const [key, instant] of [['rise', rise], ['set', set]]) {
        const marker = axis.querySelector(`[data-axis-${key}]`);
        marker.hidden = !instant;
        if (instant) {
          const [hour, minute] = showTime(instant).split(/[:.]/).map(Number);
          marker.style.left = (hour * 60 + minute) / 14.4 + '%';
        }
      }
      axis.hidden = false;
      status.textContent = 'Krajevni čas · Europe/Ljubljana';
      for (const [index, next] of table.days.slice(offset, offset + 7).entries()) {
        const nextDate = byDays(date, index);
        const row = make('div', '', 'tool-card-line');
        const label = make('time', shortFormat.format(nextDate), 'tool-date-chip');
        label.dateTime = isoDate(nextDate);
        row.append(label, make('span', `Vzhod: ${showTime(next[0])}`), make('span', `Zahod: ${showTime(next[1])}`));
        week.append(row);
      }
    } catch (error) {
      if (current === version) status.textContent = error.message;
    }
  }
  root.querySelector('[data-moon-today]').addEventListener('click', () => {
    const today = slToday();
    const input = form.elements.date;
    input.value = today < input.min ? input.min : today > input.max ? input.max : today;
    render();
  });
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  const params = new URLSearchParams(location.search);
  if ([...form.elements.city.options].some(option => option.value === params.get('city'))) form.elements.city.value = params.get('city');
  const date = form.elements.date;
  if (civilDate(params.get('date')) && params.get('date') >= date.min && params.get('date') <= date.max) date.value = params.get('date');
  else date.value = [date.min, slToday(), date.max].sort()[1];
  render();
}

const index = document.querySelector('[data-tools-directory]');
if (index) directory(index);
const tool = document.querySelector('[data-tool]');
if (tool) {
  for (const fieldset of all(tool, '[data-local-fields]')) fieldset.disabled = false;
  filterRows(tool);
  reminders(tool);
  if (tool.dataset.tool === 'vpis') admissionsTracks(tool);
  if (tool.dataset.tool === 'pokojnina') pension(tool);
  if (tool.dataset.tool === 'studij') study(tool);
  if (tool.dataset.tool === 'luna') moon(tool);
}
