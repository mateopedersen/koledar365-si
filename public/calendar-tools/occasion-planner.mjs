import { byDays, calendarDocument, civilDate, isoDate } from './local-tools-core.mjs';
import { localDate, wallTimeCandidates } from '../horoscope/math-v1.mjs';

const personalKey = 'k365.personal.v1';
const reminderTimes = {
  evening: [-1, '21:00'],
  morning: [0, '09:00'],
  week: [-7, '09:00'],
};

function reminderAt(start, choice) {
  const setting = reminderTimes[choice];
  if (!setting) return null;
  const [offset, time] = setting;
  const day = isoDate(byDays(civilDate(start), offset));
  return wallTimeCandidates(day, time, 'Europe/Ljubljana')[0] || null;
}

function addPersonal(entry, reminder, pageUrl) {
  const raw = localStorage.getItem(personalKey);
  const book = raw ? JSON.parse(raw) : { events: [], notes: {} };
  if (!Array.isArray(book?.events) || !book.notes || typeof book.notes !== 'object') throw Error();

  const existing = book.events.find(row => row?.uid === entry.key);
  const timestamp = reminder?.toISOString() || '';
  if (existing) {
    if ((existing.reminder_at || '') === timestamp) return 'Ta datum je že v vašem koledarju.';
    existing.reminder_at = timestamp;
    localStorage.setItem(personalKey, JSON.stringify(book));
    return 'Opomnik v vašem koledarju je posodobljen.';
  }

  if (book.events.length >= 500) return 'Koledar že vsebuje 500 dogodkov. Odstranite zapis ali prenesite datoteko ICS.';
  book.events.push({
    uid: entry.key, title: entry.title, date: entry.start, end_date: entry.end,
    time: '', kind: 'event', repeat: '', category: 'personal',
    notes: [entry.detail, pageUrl].join('\n'), reminder_at: timestamp,
  });
  localStorage.setItem(personalKey, JSON.stringify(book));
  return 'Datum je shranjen v tem brskalniku.';
}

function setupPlanner(root) {
  const find = name => root.querySelector(`[data-occasion-${name}]`);
  const dataset = root.dataset;
  const dateData = find('dates');
  const entries = dateData ? JSON.parse(dateData.textContent) : [];
  const dateSelect = find('select');
  const reminderSelect = find('reminder');
  const google = find('google');
  const icsLinks = root.querySelectorAll('[data-occasion-ics]');
  const local = find('local');
  const native = find('native');
  const copy = find('copy');
  const mail = find('mail');
  const link = find('link');
  const status = find('message');
  const home = find('home');
  const initialDate = new URLSearchParams(location.search).get('datum');
  let entry;
  let shareUrl = dataset.occasionUrl;

  const showMessage = text => {
    status.textContent = text;
    status.hidden = !text;
  };

  function selectDate(key) {
    entry = entries.find(row => row.key === key);
    if (!entry) return;

    const dateUrl = new URL(dataset.occasionUrl);
    dateUrl.searchParams.set('datum', entry.start);
    dateUrl.hash = 'dodaj-v-koledar';
    shareUrl = dateUrl.href;

    find('month').textContent = entry.month;
    find('day').textContent = entry.day;
    find('weekday').textContent = entry.weekday;
    find('label').textContent = entry.title;
    find('date').dateTime = entry.start;
    find('date').textContent = entry.label;
    find('detail').textContent = entry.detail;
    find('date-state').hidden = entry.end >= localDate();

    const data = new URLSearchParams({
      action: 'TEMPLATE', text: entry.title,
      dates: [entry.start, entry.endExclusive].map(day => day.replaceAll('-', '')).join('/'),
      details: [entry.detail, shareUrl].join('\n'),
    });
    if (entry.location) data.set('location', entry.location);
    google.href = 'https://calendar.google.com/calendar/render?' + data;
    const icsFilename = `${dataset.occasionFile}-${entry.start}.ics`;
    icsLinks.forEach(link => { link.download = icsFilename; });
    mail.href = `mailto:?subject=${encodeURIComponent(entry.title)}&body=${encodeURIComponent(shareUrl)}`;

    const [year, month] = entry.start.split('-');
    const calendarQuery = new URLSearchParams({ year, month: String(Number(month)), date: entry.start, view: 'day' });
    home.href = `/?${calendarQuery}#personal-planner`;
    home.hidden = true;
    link.hidden = true;
    showMessage('');
  }

  if (entries.length) {
    const current = entries.find(row => row.start === initialDate)
      || entries.find(row => row.end >= localDate())
      || entries.at(-1);
    dateSelect.value = current.key;
    selectDate(current.key);
    dateSelect.disabled = false;
    reminderSelect.disabled = false;
    local.hidden = false;

    dateSelect.addEventListener('change', () => selectDate(dateSelect.value));
    function downloadIcs(event) {
      if (!globalThis.Calendar365Downloads) {
        event.preventDefault();
        showMessage('Prenos ni na voljo. Osvežite stran in poskusite znova.');
        return;
      }
      event.preventDefault();
      try {
        const file = calendarDocument([{
          uid: entry.key, title: entry.title, date: entry.start, end: entry.end,
          location: entry.location, note: [entry.detail, shareUrl].join('\n'),
          reminderAt: reminderAt(entry.start, reminderSelect.value),
        }]);
        globalThis.Calendar365Downloads.save(file, event.currentTarget.download);
        showMessage('Datoteka ICS je pripravljena za uvoz.');
      } catch {
        showMessage('Prenos ni uspel. Poskusite znova.');
      }
    }
    icsLinks.forEach(link => link.addEventListener('click', downloadIcs));
    local.addEventListener('click', () => {
      try {
        const message = addPersonal(entry, reminderAt(entry.start, reminderSelect.value), shareUrl);
        home.hidden = false;
        showMessage(message);
      } catch {
        showMessage('Zapisa ni bilo mogoče shraniti v tem brskalniku. Prenesete lahko datoteko ICS.');
      }
    });
  }

  function showLink() {
    link.value = shareUrl;
    link.hidden = false;
    link.focus();
    link.select();
    showMessage('Označeno povezavo lahko kopirate.');
  }

  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      showMessage('Povezava je kopirana.');
    } catch {
      showLink();
    }
  });

  if (navigator.share) {
    native.hidden = false;
    native.addEventListener('click', async () => {
      try {
        await navigator.share({ title: entry?.title || dataset.occasionTitle, url: shareUrl });
      } catch (error) {
        if (error.name !== 'AbortError') showLink();
      }
    });
  }
}

document.querySelectorAll('[data-occasion-planner]').forEach(setupPlanner);
