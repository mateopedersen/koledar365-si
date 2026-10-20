(function (root, factory) {
  const planner = factory();
  if (typeof module === 'object' && module.exports) module.exports = planner;
  if (root) root.K365VacationPlanner = planner;
})(typeof globalThis === 'undefined' ? this : globalThis, function () {
  'use strict';

  const DAY_MS = 24 * 60 * 60 * 1000;
  const SUPPORTED_YEARS = [2027, 2028, 2029, 2030];

  function isoDate(year, index) {
    return new Date(Date.UTC(year, 0, index + 1, 12)).toISOString().slice(0, 10);
  }

  function dayInfo(year, index, holidays) {
    const date = isoDate(year, index);
    const weekday = new Date(Date.UTC(year, 0, index + 1, 12)).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const holidayNames = holidays.get(date) || [];
    return { date, weekday, weekend, holidayNames, free: weekend || holidayNames.length > 0 };
  }

  function buildOptions(year, budget, holidayRows) {
    if (!SUPPORTED_YEARS.includes(Number(year))) throw new RangeError('Podprta so leta 2027–2030.');
    if (!Number.isInteger(Number(budget)) || Number(budget) < 0 || Number(budget) > 30) {
      throw new RangeError('Proračun dopusta mora biti med 0 in 30 dni.');
    }

    const selectedYear = Number(year);
    const maxLeave = Number(budget);
    const holidays = new Map();
    for (const row of holidayRows || []) {
      if (!row || typeof row.date !== 'string' || !row.date.startsWith(`${selectedYear}-`)) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date)) continue;
      const names = holidays.get(row.date) || [];
      if (row.title && !names.includes(row.title)) names.push(row.title);
      holidays.set(row.date, names);
    }

    const count = Date.UTC(selectedYear + 1, 0, 1) - Date.UTC(selectedYear, 0, 1);
    const daysInYear = count / DAY_MS;
    const days = Array.from({ length: daysInYear }, (_, index) => dayInfo(selectedYear, index, holidays));
    const options = [];

    for (let start = 0; start < days.length; start += 1) {
      if (!days[start].free) continue;
      let leaveDays = 0;
      const leaveDates = [];
      for (let finish = start; finish < days.length; finish += 1) {
        const day = days[finish];
        const isWorkday = day.weekday >= 1 && day.weekday <= 5;
        if (isWorkday && day.holidayNames.length === 0) {
          leaveDays += 1;
          leaveDates.push(day.date);
        }
        if (leaveDays > maxLeave) break;
        const totalDays = finish - start + 1;
        if (totalDays < 3 || !day.free) continue;

        const holidayNames = [];
        for (let index = start; index <= finish; index += 1) {
          for (const title of days[index].holidayNames) {
            if (!holidayNames.includes(title)) holidayNames.push(title);
          }
        }
        options.push({
          key: `${days[start].date}/${day.date}`,
          from: days[start].date,
          to: day.date,
          fromIndex: start,
          toIndex: finish,
          leaveDays,
          leaveDates: leaveDates.slice(),
          totalDays,
          holidayNames,
          efficiency: leaveDays === 0 ? Infinity : totalDays / leaveDays
        });
      }
    }

    return options;
  }

  function compareEfficiency(a, b) {
    if (a.efficiency !== b.efficiency) return b.efficiency - a.efficiency;
    if (a.totalDays !== b.totalDays) return b.totalDays - a.totalDays;
    if (a.leaveDays !== b.leaveDays) return a.leaveDays - b.leaveDays;
    return a.from.localeCompare(b.from) || a.to.localeCompare(b.to);
  }

  function individualSuggestions(options, limit) {
    const selected = [];
    const sorted = options.slice().sort(compareEfficiency);
    for (const option of sorted) {
      if (selected.some(row => row.fromIndex <= option.toIndex && option.fromIndex <= row.toIndex)) continue;
      selected.push(option);
      if (selected.length >= (limit || 6)) break;
    }
    return selected;
  }

  function isBetter(candidate, current) {
    if (candidate.totalDays !== current.totalDays) return candidate.totalDays > current.totalDays;
    if (candidate.leaveDays !== current.leaveDays) return candidate.leaveDays < current.leaveDays;
    if (candidate.periods.length !== current.periods.length) return candidate.periods.length < current.periods.length;
    const candidateDates = candidate.periods.map(row => row.from).join('|');
    const currentDates = current.periods.map(row => row.from).join('|');
    return candidateDates.localeCompare(currentDates) < 0;
  }

  function optimize(options, budget) {
    const sorted = options.slice().sort((a, b) => a.toIndex - b.toIndex || a.fromIndex - b.fromIndex);
    const previous = sorted.map((option, index) => {
      let low = 0;
      let high = index;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (sorted[middle].toIndex < option.fromIndex) low = middle + 1;
        else high = middle;
      }
      return low - 1;
    });
    const empty = { totalDays: 0, leaveDays: 0, periods: [] };
    const table = Array.from({ length: sorted.length + 1 }, () => Array(Number(budget) + 1).fill(empty));

    for (let index = 1; index <= sorted.length; index += 1) {
      const option = sorted[index - 1];
      const compatibleCount = previous[index - 1] + 1;
      for (let available = 0; available <= Number(budget); available += 1) {
        let best = table[index - 1][available];
        if (option.leaveDays <= available) {
          const base = table[compatibleCount][available - option.leaveDays];
          const candidate = {
            totalDays: base.totalDays + option.totalDays,
            leaveDays: base.leaveDays + option.leaveDays,
            periods: base.periods.concat(option)
          };
          if (isBetter(candidate, best)) best = candidate;
        }
        table[index][available] = best;
      }
    }

    const result = table[sorted.length][Number(budget)];
    return { ...result, periods: result.periods.slice().sort((a, b) => a.from.localeCompare(b.from)) };
  }

  function calculate(year, budget, holidayRows) {
    const options = buildOptions(year, budget, holidayRows);
    return {
      year: Number(year),
      budget: Number(budget),
      options,
      optimized: optimize(options, Number(budget)),
      suggestions: individualSuggestions(options, 6)
    };
  }

  return { buildOptions, calculate, individualSuggestions, optimize };
});

(function () {
  'use strict';
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-vacation-planner]');
  const planner = window.K365VacationPlanner;
  if (!root || !planner) return;

  const $ = (selector, scope = root) => scope.querySelector(selector);
  const $$ = (selector, scope = root) => Array.from(scope.querySelectorAll(selector));
  const data = JSON.parse(document.querySelector('#vacation-holiday-data').textContent);
  const form = $('#vacation-controls');
  const slider = $('#vacation-budget');
  let result;
  let selectedKeys = [];
  let suggestionKeys = [];
  let customPlan = false;

  function dateFromIso(value) {
    return new Date(`${value}T12:00:00Z`);
  }

  function longDate(value) {
    return new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dateFromIso(value));
  }

  function weekday(value) {
    return new Intl.DateTimeFormat('sl-SI', { weekday: 'long', timeZone: 'UTC' }).format(dateFromIso(value));
  }

  function monthShort(value) {
    return new Intl.DateTimeFormat('sl-SI', { month: 'short', timeZone: 'UTC' }).format(dateFromIso(value)).replace('.', '').toUpperCase();
  }

  function dateRange(option) {
    return `${longDate(option.from)} – ${longDate(option.to)}`;
  }

  function compactDateRange(option) {
    const formatter = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    return `${formatter.format(dateFromIso(option.from))} – ${formatter.format(dateFromIso(option.to))}`;
  }

  function dayWord(count) {
    if (count === 1) return 'dan';
    if (count === 2) return 'dneva';
    return 'dni';
  }

  function leaveLabel(count) {
    if (count === 0) return 'Brez porabe dopusta';
    return `${count} ${dayWord(count)} dopusta`;
  }

  function totalLabel(count) {
    return `${count} ${dayWord(count)} oddiha`;
  }

  function renderMetrics(periods) {
    const days = periods.reduce((total, option) => total + option.totalDays, 0);
    const leave = periods.reduce((total, option) => total + option.leaveDays, 0);
    $('[data-vacation-total]').textContent = String(days);
    $('[data-vacation-spent]').textContent = `${leave} / ${result.budget}`;
    $('[data-vacation-breaks]').textContent = String(periods.length);
    $('[data-vacation-year]').textContent = String(result.year);
    $('#vacation-budget-value').textContent = `${result.budget} ${dayWord(result.budget)}`;

    if (periods.length === 0) {
      $('[data-vacation-summary]').textContent = 'Za ta proračun v izbranem letu ni daljšega oddiha. Poskusi povečati število dni dopusta.';
      $('[data-vacation-efficiency]').textContent = 'Povečaj proračun in preveri dodatne priložnosti.';
    } else if (leave === 0) {
      $('[data-vacation-summary]').textContent = `Dobiš ${totalLabel(days)} brez porabe dopusta.`;
      $('[data-vacation-efficiency]').textContent = 'Načrt združuje proste praznike in vikende.';
    } else {
      const ratio = (days / leave).toFixed(1).replace('.', ',');
      $('[data-vacation-summary]').textContent = `Skupaj ${totalLabel(days)} · porabljenih ${leaveLabel(leave)}.`;
      $('[data-vacation-efficiency]').textContent = `Vsak dan dopusta ti prinese približno ${ratio} dni skupnega oddiha.`;
    }
  }

  function createDateTile(option) {
    const tile = document.createElement('span');
    tile.className = 'vacation-break-date';
    const month = document.createElement('small');
    month.textContent = monthShort(option.from);
    const day = document.createElement('strong');
    day.textContent = String(dateFromIso(option.from).getUTCDate());
    tile.append(month, day);
    return tile;
  }

  function createHolidayTags(option) {
    const tags = document.createElement('div');
    tags.className = 'vacation-break-holidays';
    if (!option.holidayNames.length) {
      const weekend = document.createElement('span');
      weekend.className = 'vacation-weekend-tag';
      weekend.textContent = 'Vikend';
      tags.append(weekend);
      return tags;
    }
    for (const title of option.holidayNames.slice(0, 2)) {
      const tag = document.createElement('span');
      tag.textContent = title;
      tags.append(tag);
    }
    return tags;
  }

  function renderPlan() {
    const planRoot = $('[data-vacation-plan-list]');
    const periods = selectedKeys.map(key => result.options.find(option => option.key === key)).filter(Boolean).sort((a, b) => a.from.localeCompare(b.from));
    const totalDays = periods.reduce((sum, option) => sum + option.totalDays, 0);
    const leaveDays = periods.reduce((sum, option) => sum + option.leaveDays, 0);
    const remaining = result.budget - leaveDays;

    planRoot.replaceChildren();
    if (periods.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'vacation-empty-plan';
      empty.innerHTML = '<span aria-hidden="true">✦</span><strong>Načrt se začne z dobrim datumom.</strong><p>Dodaj enega od predlogov spodaj ali izberi več dni dopusta.</p>';
      planRoot.append(empty);
    } else {
      for (const option of periods) {
        const row = document.createElement('article');
        row.className = 'vacation-plan-item';
        const tile = createDateTile(option);
        const copy = document.createElement('div');
        copy.className = 'vacation-plan-item__copy';
        const title = document.createElement('h4');
        title.textContent = dateRange(option);
        const dates = document.createElement('p');
        dates.textContent = `${weekday(option.from)} – ${weekday(option.to)}`;
        copy.append(title, dates, createHolidayTags(option));
        const details = document.createElement('div');
        details.className = 'vacation-plan-item__details';
        const total = document.createElement('strong');
        total.textContent = totalLabel(option.totalDays);
        const leave = document.createElement('span');
        leave.textContent = leaveLabel(option.leaveDays);
        details.append(total, leave);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'vacation-remove-period';
        remove.dataset.removePlan = option.key;
        remove.setAttribute('aria-label', `Odstrani obdobje ${dateRange(option)} iz načrta`);
        remove.textContent = 'Odstrani';
        details.append(remove);
        row.append(tile, copy, details);
        planRoot.append(row);
      }
    }

    renderMetrics(periods);
    $('[data-vacation-mode]').textContent = customPlan ? 'Tvoj načrt' : 'Optimiziran načrt';
    $('[data-vacation-plan-caption]').textContent = customPlan
      ? `Porabljenih bo ${leaveDays} od ${result.budget} dni dopusta. Začni znova, da samodejno razporedimo preostali proračun.`
      : `Najdaljši skupni oddih, ki ga omogoča ${result.budget} ${dayWord(result.budget)} izbranega proračuna. Ostane ti ${remaining} ${dayWord(remaining)} za druge načrte.`;
    $('[data-vacation-export]').disabled = periods.length === 0;
    $('[data-vacation-copy]').disabled = periods.length === 0;
    $('[data-vacation-status]').textContent = '';
  }

  function renderSuggestions() {
    const target = $('[data-vacation-suggestions]');
    target.replaceChildren();
    $('[data-vacation-suggestion-count]').textContent = `${result.options.length} ${result.options.length === 1 ? 'možnost' : 'možnosti'}`;

    if (result.suggestions.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'vacation-empty-suggestions';
      empty.textContent = 'Za izbrano število dni v tem letu ni daljšega oddiha. Povečaj proračun in poglej nove možnosti.';
      target.append(empty);
      return;
    }

    const visibleOptions = suggestionKeys.map(key => result.options.find(option => option.key === key)).filter(Boolean);
    for (const option of visibleOptions) {
      const included = selectedKeys.includes(option.key);
      const blockedByOverlap = !included && selectedKeys.some(key => {
        const selected = result.options.find(item => item.key === key);
        return selected && selected.fromIndex <= option.toIndex && option.fromIndex <= selected.toIndex;
      });
      const selectedLeave = selectedKeys.reduce((sum, key) => sum + (result.options.find(item => item.key === key)?.leaveDays || 0), 0);
      const blockedByBudget = !included && selectedLeave + option.leaveDays > result.budget;

      const card = document.createElement('article');
      card.className = `vacation-suggestion-card${included ? ' is-in-plan' : ''}`;
      const header = document.createElement('div');
      header.className = 'vacation-suggestion-card__top';
      header.append(createDateTile(option));
      const dateCopy = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = compactDateRange(option);
      const year = document.createElement('p');
      year.textContent = `${weekday(option.from)} – ${weekday(option.to)} · ${result.year}`;
      dateCopy.append(title, year);
      header.append(dateCopy);

      const stats = document.createElement('div');
      stats.className = 'vacation-suggestion-card__stats';
      const total = document.createElement('div');
      total.innerHTML = `<strong>${option.totalDays}</strong><span>${dayWord(option.totalDays)} oddiha</span>`;
      const leave = document.createElement('div');
      const leaveNumber = document.createElement('strong');
      leaveNumber.textContent = String(option.leaveDays);
      const leaveText = document.createElement('span');
      leaveText.textContent = `${dayWord(option.leaveDays)} dopusta`;
      leave.append(leaveNumber, leaveText);
      stats.append(total, leave);

      const tags = createHolidayTags(option);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = included ? 'vacation-add-period is-selected' : 'vacation-add-period';
      button.dataset.togglePlan = option.key;
      button.setAttribute('aria-pressed', String(included));
      button.disabled = blockedByOverlap || blockedByBudget;
      button.textContent = included ? 'V tvojem načrtu · odstrani' : blockedByOverlap ? 'Sovpada z načrtom' : blockedByBudget ? 'Presega proračun' : 'Dodaj v moj načrt';
      card.append(header, stats, tags, button);
      target.append(card);
    }
  }

  function updatePlan() {
    renderPlan();
    renderSuggestions();
    $('.vacation-results').setAttribute('aria-busy', 'false');
  }

  function recalculate() {
    const year = Number(form.elements.year.value);
    const budget = Number(slider.value);
    $$('[data-budget-preset]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.budgetPreset) === budget)));
    result = planner.calculate(year, budget, data);
    selectedKeys = result.optimized.periods.map(option => option.key);
    suggestionKeys = Array.from(new Set([...selectedKeys, ...result.suggestions.map(option => option.key)]));
    customPlan = false;
    $('#vacation-controls').dataset.year = String(year);
    updatePlan();
  }

  function periodText(option) {
    const leave = option.leaveDates.length ? `Dopust: ${option.leaveDates.map(longDate).join(', ')}` : 'Dopusta ni treba porabiti.';
    const holidays = option.holidayNames.length ? `Prazniki: ${option.holidayNames.join(', ')}` : '';
    return `${dateRange(option)} · ${totalLabel(option.totalDays)} · ${leave}${holidays ? ` · ${holidays}` : ''}`;
  }

  function planText() {
    const periods = selectedKeys.map(key => result.options.find(option => option.key === key)).filter(Boolean).sort((a, b) => a.from.localeCompare(b.from));
    return [`Koledar365 · načrt dopusta ${result.year}`, '', ...periods.map((option, index) => `${index + 1}. ${periodText(option)}`)].join('\n');
  }

  function escapeIcs(value) {
    return String(value).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }

  function foldIcsLine(line) {
    const parts = [];
    let part = '';
    let bytes = 0;
    for (const character of line) {
      const size = new TextEncoder().encode(character).length;
      if (bytes + size > 75) {
        parts.push(part);
        part = ' ';
        bytes = 1;
      }
      part += character;
      bytes += size;
    }
    parts.push(part);
    return parts.join('\r\n');
  }

  function nextIsoDate(value) {
    const date = dateFromIso(value);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }

  function downloadCalendar() {
    const periods = selectedKeys.map(key => result.options.find(option => option.key === key)).filter(Boolean).sort((a, b) => a.from.localeCompare(b.from));
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const events = periods.flatMap(option => [
      'BEGIN:VEVENT',
      `UID:${escapeIcs(option.key)}@koledar365.si`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${option.from.replace(/-/g, '')}`,
      `DTEND;VALUE=DATE:${nextIsoDate(option.to).replace(/-/g, '')}`,
      `SUMMARY:${escapeIcs(`Oddih ${result.year} · ${option.totalDays} dni`)}`,
      `DESCRIPTION:${escapeIcs(periodText(option))}`,
      'END:VEVENT'
    ]);
    const calendar = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Koledar365//SL', 'CALSCALE:GREGORIAN', ...events, 'END:VCALENDAR', ''].map(foldIcsLine).join('\r\n');
    const url = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `koledar365-oddihi-${result.year}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('[data-vacation-status]').textContent = 'Datoteka ICS je pripravljena za uvoz v tvoj koledar.';
  }

  function toggleOption(key) {
    const index = selectedKeys.indexOf(key);
    if (index >= 0) {
      selectedKeys.splice(index, 1);
    } else {
      const option = result.options.find(item => item.key === key);
      if (!option) return;
      const selected = selectedKeys.map(item => result.options.find(row => row.key === item)).filter(Boolean);
      const used = selected.reduce((sum, row) => sum + row.leaveDays, 0);
      if (used + option.leaveDays > result.budget || selected.some(row => row.fromIndex <= option.toIndex && option.fromIndex <= row.toIndex)) return;
      selectedKeys.push(key);
    }
    customPlan = true;
    updatePlan();
    const periods = selectedKeys.map(item => result.options.find(row => row.key === item)).filter(Boolean);
    const used = periods.reduce((sum, row) => sum + row.leaveDays, 0);
    $('[data-vacation-status]').textContent = `Načrt posodobljen. Porabljenih ${used} od ${result.budget} dni dopusta.`;
  }

  slider.addEventListener('input', recalculate);
  $$('[data-budget-preset]').forEach(button => button.addEventListener('click', () => {
    slider.value = button.dataset.budgetPreset;
    $$('[data-budget-preset]').forEach(preset => preset.setAttribute('aria-pressed', String(preset === button)));
    recalculate();
  }));
  $$('.vacation-year-options input').forEach(input => input.addEventListener('change', recalculate));
  $('[data-vacation-suggestions]').addEventListener('click', event => {
    const button = event.target.closest('[data-toggle-plan]');
    if (button && !button.disabled) toggleOption(button.dataset.togglePlan);
  });
  $('[data-vacation-plan-list]').addEventListener('click', event => {
    const button = event.target.closest('[data-remove-plan]');
    if (button) toggleOption(button.dataset.removePlan);
  });
  $('[data-vacation-reset]').addEventListener('click', () => {
    recalculate();
    $('[data-vacation-status]').textContent = 'Znova smo izbrali najučinkovitejšo razporeditev.';
  });
  $('[data-vacation-export]').addEventListener('click', downloadCalendar);
  $('[data-vacation-copy]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(planText());
      $('[data-vacation-status]').textContent = 'Načrt je kopiran. Lahko ga prilepiš v sporočilo ali zapiske.';
    } catch {
      $('[data-vacation-status]').textContent = 'Kopiranje ni na voljo. Poskusi v varni povezavi HTTPS.';
    }
  });

  recalculate();
})();
