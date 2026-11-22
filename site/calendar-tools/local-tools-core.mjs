export const DAY = 86400000;
export function civilDate(text) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text || '')) return null;
  const date = new Date(text + 'T00:00:00.000Z');
  return Number.isFinite(+date) && isoDate(date) === text ? date : null;
}

export const isoDate = date => date.toISOString().slice(0, 10);
export const byDays = (date, days) => new Date(+date + days * DAY);

function byMonths(date, count) {
  const first = new Date(date);
  first.setUTCDate(1);
  first.setUTCMonth(first.getUTCMonth() + count);
  const after = new Date(first);
  after.setUTCMonth(after.getUTCMonth() + 1, 0);
  first.setUTCDate(Math.min(date.getUTCDate(), after.getUTCDate()));
  return first;
}

export function retirementPaths({ birth, years15, years40, years40all }) {
  const birthday = civilDate(birth);
  if (!birthday) throw new Error('Vpišite veljaven datum rojstva.');
  const values = [years15, years40, years40all];
  const dates = values.map(civilDate);
  if (!dates.some(Boolean)) throw new Error('Vpišite vsaj en datum dopolnitve zavarovalne ali pokojninske dobe.');
  const earliest = [15, 40, 40].map(years => byMonths(birthday, years * 12));
  if (dates.some((date, index) => values[index] && (!date || date < earliest[index]))) {
    throw new Error('Datum dopolnitve dobe je prezgoden glede na rojstni datum.');
  }
  if ((dates[0] && dates.slice(1).some(date => date && date < dates[0])) ||
      (dates[1] && dates[2] && dates[2] > dates[1])) {
    throw new Error('Preverite vrstni red datumov. Skupno 40 let dobe lahko dopolnite prej kot 40 let brez dokupa.');
  }

  const options = [];
  for (const minYears of [40, 15]) {
    for (let year = 2026; year <= 2130; year += 1) {
      const service = minYears === 15 ? dates[0] : year < 2035 ? dates[1] : dates[2] || dates[1];
      if (!service || service.getUTCFullYear() > year) continue;
      const ageMonths = (minYears === 40 ? 60 : 65) * 12 + Math.max(0, Math.min((year - 2027) * 3, 24));
      const ageDate = byMonths(birthday, ageMonths);
      const candidate = new Date(Math.max(+civilDate(year + '-01-01'), +ageDate, +service));
      if (candidate.getUTCFullYear() !== year) continue;
      options.push({ minYears, ageMonths, ageDate: isoDate(ageDate), serviceDate: isoDate(service), date: isoDate(candidate) });
      break;
    }
  }
  return options.sort((a, b) => a.date.localeCompare(b.date) || b.minYears - a.minYears);
}

// Article 37 fixes the additional six-month rate separately from the annual rate.
const RATE = [
  [29.5, 1.36, .68], [29.5, 1.36, .68], [30, 1.39, .70], [30, 1.42, .71], [30, 1.45, .73],
  [30, 1.48, .74], [30, 1.51, .76], [30, 1.54, .77], [30, 1.57, .79], [30, 1.60, .80]
];
export function pensionAmount(year, base, years, months) {
  if (!Number.isInteger(year) || year < 2026 || year > 2130 ||
      !Number.isFinite(base) || base < 1 || base > 100000 ||
      !Number.isInteger(years) || years < 15 || years > 60 ||
      !Number.isInteger(months) || months < 0 || months > 11) {
    throw new Error('Preverite leto, osnovo in pokojninsko dobo.');
  }
  const [starting, annual, half] = RATE[Math.min(year - 2026, RATE.length - 1)];
  const rate = Math.round((starting + (years - 15) * annual + (months >= 6 ? half : 0)) * 100) / 100;
  const baseCents = Math.round(base * 100);
  return { rate, amount: Math.round(baseCents * Math.round(rate * 100) / 10000) / 100 };
}

export function studyPlan({ start, end, hours, strategy, include }) {
  const from = civilDate(start), to = civilDate(end);
  const between = from && to ? (+to - +from) / DAY : -1;
  if (between < 0 || between > 366) throw new Error('Izberite pravilen razpon do največ enega leta.');
  if (!Number.isFinite(hours) || hours < .5 || hours > 600) throw new Error('Vpišite od 0,5 do 600 ur učenja.');
  const eligible = [];
  for (let i = 0; i < between + Number(Boolean(include)); i += 1) {
    const date = byDays(from, i);
    const weekday = date.getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    if (strategy === 'daily' || (strategy === 'weekend' ? weekend : !weekend)) eligible.push(date);
  }
  if (!eligible.length) throw new Error('V izbranem obdobju ni dni za učenje. Spremenite datum ali izbor dni.');
  const target = Math.round(hours * 60);
  const days = eligible.map((date, index) => {
    const minutes = Math.round((index + 1) * target / eligible.length) - Math.round(index * target / eligible.length);
    return { date: isoDate(date), minutes };
  }).filter(day => day.minutes > 0);
  const weeks = new Map();
  for (const day of days) {
    const date = civilDate(day.date);
    const monday = isoDate(byDays(date, -((date.getUTCDay() + 6) % 7)));
    const week = weeks.get(monday) || { first: monday, dates: 0, minutes: 0 };
    week.dates += 1;
    week.minutes += day.minutes;
    weeks.set(monday, week);
  }
  return { days, weeks: [...weeks.values()], target };
}

function escapeText(value) {
  return String(value).replace(/[\\;,]/g, char => '\\' + char).replace(/\r\n|\n|\r/g, '\\n');
}
function foldLine(line) {
  const output = [];
  let chunk = '', bytes = 0;
  const encoder = new TextEncoder();
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      output.push(chunk);
      chunk = ' ';
      bytes = 1;
    }
    chunk += char;
    bytes += size;
  }
  output.push(chunk);
  return output.join('\r\n');
}

export function calendarDocument(entries, now = new Date()) {
  const compact = text => text.replace(/-/g, '');
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Koledar365//Orodja//SL', 'CALSCALE:GREGORIAN'];
  entries.forEach((entry, index) => {
    const begin = civilDate(entry.date), end = civilDate(entry.end) || begin;
    if (!begin || end < begin) return;
    lines.push('BEGIN:VEVENT', 'UID:' + encodeURIComponent(entry.uid || `tool-${entry.date}-${index}`) + '@koledar365.si',
      'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + compact(entry.date),
      'DTEND;VALUE=DATE:' + compact(isoDate(byDays(end, 1))), 'SUMMARY:' + escapeText(entry.title));
    if (entry.note) lines.push('DESCRIPTION:' + escapeText(entry.note));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR', '');
  return lines.map(foldLine).join('\r\n');
}
