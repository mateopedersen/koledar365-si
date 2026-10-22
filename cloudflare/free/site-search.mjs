const MONTHS = [
  'januar', 'februar', 'marec', 'april', 'maj', 'junij',
  'julij', 'avgust', 'september', 'oktober', 'november', 'december'
];

const STOP_WORDS = new Set(['a', 'ali', 'in', 'je', 'na', 'od', 'o', 'po', 'pri', 's', 'se', 'v', 'za']);

export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[đĐ]/g, 'd')
    .toLocaleLowerCase('sl-SI')
    .replace(/[–—−]/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
function editDistanceAtMostOne(left, right) {
  if (Math.abs(left.length - right.length) > 1 || left[0] !== right[0]) return false;
  let a = 0;
  let b = 0;
  let differences = 0;

  while (a < left.length && b < right.length) {
    if (left[a] === right[b]) {
      a += 1;
      b += 1;
      continue;
    }

    differences += 1;
    if (differences > 1) return false;
    if (left.length > right.length) a += 1;
    else if (right.length > left.length) b += 1;
    else {
      a += 1;
      b += 1;
    }
  }

  if (a < left.length || b < right.length) differences += 1;
  return differences <= 1;
}

export function resultCategory(result) {
  const path = result.path || '';
  if (path.startsWith('/soncni-vzhod-in-zahod/')) return 'Sončni časi';
  if (/^\/(lunin-koledar|lunine-mene|polna-luna|mlaj)\//.test(path)) return 'Luna';
  if (/^\/(prazniki|pomembni-dnevi|letni-casi)\//.test(path)) return 'Prazniki in dnevi';
  if (/^\/(koledar|mesecni-koledar|tedenski-koledar)\//.test(path)) return 'Koledarji';
  return 'Orodja';
}

export function parseDateQuery(value) {
  const query = normalizeSearchText(value);
  let year;
  let month;
  let day;
  let match = query.match(/^(\d{4}) (\d{1,2}) (\d{1,2})$/);

  if (match) {
    [, year, month, day] = match;
  } else {
    match = query.match(/^(\d{1,2}) (\d{1,2}) (\d{4})$/);
    if (match) [, day, month, year] = match;
    else {
      match = query.match(/^(\d{1,2}) ([a-z]+) (\d{4})$/);
      if (!match) return null;
      [, day, month, year] = match;
      month = MONTHS.indexOf(month) + 1;
      if (month < 1) return null;
    }
  }

  year = Number(year);
  month = Number(month);
  day = Number(day);
  if (year < 2026 || year > 2030 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return {
    title: `${day}. ${MONTHS[month - 1]} ${year}`,
    path: `/?${new URLSearchParams({ year, month, date: iso, view: 'day' })}`,
    type: 'Datum',
    folded: normalizeSearchText(`${day} ${MONTHS[month - 1]} ${year} ${iso}`),
    priority: -100,
    score: 1000,
    category: 'Datumi'
  };
}

function scoreResult(result, phrase, tokens) {
  const folded = normalizeSearchText([result.folded, result.title, result.path, result.keywords].filter(Boolean).join(' '));
  const title = normalizeSearchText(result.title || '');
  const words = folded.split(' ');
  const titleWords = title.split(' ');
  let score = 0;
  let matches = 0;

  if (folded === phrase) score += 180;
  else if (folded.includes(phrase)) score += 70;

  for (const token of tokens) {
    if (words.includes(token)) {
      score += 34;
      matches += 1;
      if (titleWords.includes(token)) score += 24;
      continue;
    }

    if (words.some(word => word.startsWith(token))) {
      score += 22;
      matches += 1;
      continue;
    }

    if (token.length >= 4 && folded.includes(token)) {
      score += 14;
      matches += 1;
      continue;
    }

    if (token.length >= 4 && words.some(word => word.length >= 4 && editDistanceAtMostOne(token, word))) {
      score += 8;
      matches += 1;
      if (titleWords.some(word => word.length >= 4 && editDistanceAtMostOne(token, word))) score += 36;
    }
  }

  if (!matches) return 0;
  score += matches === tokens.length ? 42 : Math.round(24 * matches / tokens.length);

  if (title === phrase || title === `ime ${phrase}`) score += 110;
  else if (title.includes(phrase)) score += 36;
  if (result.path?.includes(phrase.replaceAll(' ', '-'))) score += 10;
  score -= Math.min(Number(result.priority) || 0, 500) / 100;
  return score;
}

export function searchRecords(records, query, { limit = 50, fuzzy = true } = {}) {
  const phrase = normalizeSearchText(query);
  if (!phrase) return { results: [], total: 0 };
  const tokens = phrase.split(' ').filter(token => !STOP_WORDS.has(token));
  if (!tokens.length) return { results: [], total: 0 };

  const byPath = new Map();
  for (const source of records) {
    const result = { ...source };
    const score = scoreResult(result, phrase, tokens);
    if (!score || (!fuzzy && score < 35)) continue;
    result.score = score;
    result.category = result.category || resultCategory(result);
    const previous = byPath.get(result.path);
    if (!previous || result.score > previous.score) byPath.set(result.path, result);
  }

  const dateResult = parseDateQuery(query);
  if (dateResult) byPath.set(dateResult.path, dateResult);

  const results = [...byPath.values()].sort((a, b) => b.score - a.score || (Number(a.priority) || 0) - (Number(b.priority) || 0) || a.title.localeCompare(b.title, 'sl'));
  return { results: results.slice(0, limit), total: results.length };
}
