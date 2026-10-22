(() => {
  const calculator = document.querySelector('[data-workday-calculator]');
  if (calculator) {
    const tabs = [...calculator.querySelectorAll('[data-wdc-mode]')];
    const panels = [...calculator.querySelectorAll('[data-wdc-panel]')];
    const result = calculator.querySelector('[data-wdc-result]');
    const status = calculator.querySelector('[data-wdc-status]');
    const number = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 2 });
    const dateFormat = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const weekdayFormat = new Intl.DateTimeFormat('sl-SI', { weekday: 'long', timeZone: 'UTC' });
    const parseDate = (value) => {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
      if (!match) return null;
      const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
      return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? date : null;
    };
    const dateISO = (date) => date.toISOString().slice(0, 10);
    const dateText = (value) => {
      const date = parseDate(value);
      return date ? dateFormat.format(date) : value;
    };
    const weekdayText = (value) => {
      const date = parseDate(value);
      if (!date) return '';
      const weekday = weekdayFormat.format(date);
      return weekday.charAt(0).toLocaleUpperCase('sl-SI') + weekday.slice(1);
    };
    const workdayLabel = (value) => {
      if (value === 1) return 'delovni dan';
      if (value === 2) return 'delovna dneva';
      if (value === 3 || value === 4) return 'delovne dni';
      return 'delovnih dni';
    };
    const showStatus = (message, error = false) => {
      status.textContent = message;
      status.setAttribute('role', error ? 'alert' : 'status');
      result.classList.toggle('wdc-result--error', error);
    };
    const activate = (mode, focus = false) => {
      const selected = mode === 'shift' ? 'shift' : 'range';
      calculator.dataset.wdcActive = selected;
      tabs.forEach((tab) => {
        const active = tab.dataset.wdcMode === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.wdcPanel !== selected; });
      status.textContent = '';
      result.classList.remove('wdc-result--error');
    };
    const renderRange = (data, form) => {
      const from = form.elements.from.value;
      const to = form.elements.to.value;
      const holidays = data.excluded_holidays || [];
      result.querySelector('[data-wdc-title]').textContent = 'Delovni dnevi v obdobju';
      result.querySelector('[data-wdc-summary]').textContent = `${dateText(from)} – ${dateText(to)}`;
      result.querySelector('[data-wdc-primary]').textContent = number.format(data.working_days);
      result.querySelector('[data-wdc-caption]').textContent = workdayLabel(data.working_days);
      result.querySelector('[data-wdc-label="calendar"]').textContent = 'Všteti koledarski dnevi';
      result.querySelector('[data-wdc-stat="calendar"]').textContent = number.format(data.calendar_days);
      result.querySelector('[data-wdc-label="hours"]').textContent = 'Skupaj delovnih ur';
      result.querySelector('[data-wdc-stat="hours"]').textContent = `${number.format(data.hours)} ur`;
      result.querySelector('[data-wdc-label="holidays"]').textContent = 'Izločeni prazniki';
      result.querySelector('[data-wdc-stat="holidays"]').textContent = number.format(holidays.length);
      result.querySelector('[data-wdc-detail]').textContent = holidays.length ? `Izločeni prazniki na izbrane delovne dni: ${holidays.map(dateText).join(', ')}.` : 'V izbranem obdobju ni bilo izločenih dela prostih praznikov.';
    };
    const renderShift = (data, form) => {
      const from = form.elements.from.value;
      const shifted = data.target_date;
      result.querySelector('[data-wdc-title]').textContent = 'Datum po delovnih dneh';
      result.querySelector('[data-wdc-summary]').textContent = `${number.format(data.working_days)} ${workdayLabel(data.working_days)} od ${dateText(from)}`;
      result.querySelector('[data-wdc-primary]').textContent = dateText(shifted);
      result.querySelector('[data-wdc-caption]').textContent = `${weekdayText(shifted)} · ${shifted}`;
      result.querySelector('[data-wdc-label="calendar"]').textContent = 'Koledarski premik';
      result.querySelector('[data-wdc-stat="calendar"]').textContent = `${number.format(data.calendar_days)} dni`;
      result.querySelector('[data-wdc-label="hours"]').textContent = 'Delovnih dni';
      result.querySelector('[data-wdc-stat="hours"]').textContent = number.format(data.working_days);
      result.querySelector('[data-wdc-label="holidays"]').textContent = 'Izločeni prazniki';
      result.querySelector('[data-wdc-stat="holidays"]').textContent = number.format((data.excluded_holidays || []).length);
      const holidays = data.excluded_holidays || [];
      result.querySelector('[data-wdc-detail]').textContent = holidays.length ? `Med izhodiščem in ciljem preskočeni prazniki: ${holidays.map(dateText).join(', ')}.` : 'Izhodiščni datum ni vštet; štetje se začne naslednji dan.';
    };
    const postCalculation = async (form) => {
      const submit = form.querySelector('[type="submit"]');
      submit.disabled = true;
      result.setAttribute('aria-busy', 'true');
      showStatus('Računam po izbranih pravilih …');
      try {
        const payload = {};
        for (const [key, value] of new FormData(form)) {
          if (key === 'authenticity_token') continue;
          if (key.endsWith('[]')) (payload[key.slice(0, -2)] ||= []).push(value);
          else payload[key] = value;
        }
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        const response = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(token ? { 'X-CSRF-Token': token } : {}) },
          body: JSON.stringify(payload),
        });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Izračun ni uspel. Preverite datume in poskusite znova.');
        if (payload.tool === 'workdays') renderRange(body.workdays, form);
        else if (body.workday_shift) renderShift(body.workday_shift, form);
        else throw new Error('Podrobnosti izračuna niso na voljo.');
        showStatus('Izračun je pripravljen.');
      } catch (error) {
        showStatus(error.message || 'Povezava ni uspela. Poskusite znova.', true);
      } finally {
        submit.disabled = false;
        result.removeAttribute('aria-busy');
      }
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset.wdcMode));
      tab.addEventListener('keydown', (event) => {
        let target = index;
        if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') target = (index + tabs.length - 1) % tabs.length;
        else if (event.key === 'Home') target = 0;
        else if (event.key === 'End') target = tabs.length - 1;
        else return;
        event.preventDefault();
        activate(tabs[target].dataset.wdcMode, true);
      });
    });
    calculator.querySelectorAll('[data-wdc-form]').forEach((form) => form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      postCalculation(form);
    }));
    calculator.querySelectorAll('[data-wdc-preset]').forEach((button) => button.addEventListener('click', () => {
      const form = calculator.querySelector('[data-wdc-form="range"]');
      const fromInput = form.elements.from;
      const toInput = form.elements.to;
      const start = parseDate(fromInput.value);
      if (!start) return;
      let days = { week: 6, month: 29, quarter: 89, year: 0 }[button.dataset.wdcPreset];
      let first = start;
      let last = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + days));
      if (button.dataset.wdcPreset === 'year') {
        first = new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
        last = new Date(Date.UTC(start.getUTCFullYear(), 11, 31));
      }
      const minimum = parseDate(fromInput.min);
      const maximum = parseDate(toInput.max);
      if (first < minimum) first = minimum;
      if (last > maximum) last = maximum;
      fromInput.value = dateISO(first);
      toInput.value = dateISO(last);
    }));
    calculator.querySelector('[data-wdc-copy]').addEventListener('click', async (event) => {
      const content = [result.querySelector('[data-wdc-title]').textContent, result.querySelector('[data-wdc-summary]').textContent, result.querySelector('[data-wdc-primary]').textContent, result.querySelector('[data-wdc-caption]').textContent, result.querySelector('[data-wdc-detail]').textContent].filter(Boolean).join('\n');
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(content);
        else {
          const input = document.createElement('textarea'); input.value = content; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input); input.select();
          const copied = document.execCommand('copy'); input.remove(); if (!copied) throw new Error('copy');
        }
        showStatus('Rezultat je kopiran.');
      } catch { showStatus('Kopiranje ni uspelo. Označite rezultat in ga kopirajte ročno.', true); }
      event.currentTarget.blur();
    });
    calculator.querySelector('[data-wdc-share]').addEventListener('click', async () => {
      const mode = calculator.dataset.wdcActive || 'range';
      const form = calculator.querySelector(`[data-wdc-form="${mode}"]`);
      const url = new URL(location.href);
      url.search = '';
      url.searchParams.set('mode', mode);
      const values = new FormData(form);
      for (const key of ['from', 'to', 'delta', 'hours']) if (values.has(key)) url.searchParams.set(key, values.get(key));
      const days = [...form.querySelectorAll('input[name="weekdays[]"]:checked')].map((input) => input.value);
      if (days.length) url.searchParams.set('weekdays', days.join(','));
      url.searchParams.set('holidays', form.querySelector('input[name="exclude_holidays"]')?.checked ? '1' : '0');
      if (mode === 'range') {
        url.searchParams.set('start', form.querySelector('input[name="include_start"]')?.checked ? '1' : '0');
        url.searchParams.set('end', form.querySelector('input[name="include_end"]')?.checked ? '1' : '0');
      }
      try {
        if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url.href);
        else {
          const input = document.createElement('textarea'); input.value = url.href; input.style.position = 'fixed'; input.style.opacity = '0'; document.body.append(input); input.select();
          const copied = document.execCommand('copy'); input.remove(); if (!copied) throw new Error('copy');
        }
        showStatus('Povezava do vašega izračuna je kopirana.');
      } catch { showStatus('Povezave ni bilo mogoče kopirati.', true); }
    });
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode') === 'shift' ? 'shift' : 'range';
    const form = calculator.querySelector(`[data-wdc-form="${mode}"]`);
    for (const key of ['from', 'to', 'delta', 'hours']) if (params.has(key) && form.elements[key]) form.elements[key].value = params.get(key);
    if (params.has('weekdays')) {
      const selected = params.get('weekdays').split(',');
      form.querySelectorAll('input[name="weekdays[]"]').forEach((input) => { input.checked = selected.includes(input.value); });
    }
    if (form.elements.exclude_holidays && params.has('holidays')) form.elements.exclude_holidays.checked = params.get('holidays') === '1';
    if (form.elements.include_start) form.elements.include_start.checked = params.get('start') !== '0';
    if (form.elements.include_end) form.elements.include_end.checked = params.get('end') !== '0';
    activate(mode);
  }

  const dashboard = document.querySelector('[data-workdays-dashboard]');
  if (!dashboard) return;

  const controls = dashboard.querySelector('[data-workdays-controls]');
  const hoursInput = controls.querySelector('[data-workdays-hours]');
  const excludeInput = controls.querySelector('[data-workdays-exclude]');
  const hoursError = controls.querySelector('[data-workdays-error]');
  const weekdayInputs = [...controls.querySelectorAll('.workdays-weekdays input')];
  const cards = [...dashboard.querySelectorAll('[data-workdays-card]')];
  const year = Number(dashboard.dataset.year);
  const formatter = new Intl.NumberFormat('sl-SI', { maximumFractionDigits: 2 });

  const workdayLabel = (count) => {
    if (count === 1) return 'delovni dan';
    if (count >= 2 && count <= 4) return 'delovni dnevi';
    return 'delovnih dni';
  };

  const update = () => {
    const hours = Number(hoursInput.value);
    const validHours = Number.isFinite(hours) && hours >= 0 && hours <= 24 && Number.isInteger(hours * 4);
    if (!validHours) {
      hoursInput.setAttribute('aria-invalid', 'true');
      hoursInput.setCustomValidity('Vnesite od 0 do 24 ur v korakih po četrt ure.');
      hoursError.textContent = 'Vnesite vrednost od 0 do 24 ur v korakih po 0,25.';
      hoursError.hidden = false;
      return;
    }
    hoursInput.removeAttribute('aria-invalid');
    hoursInput.setCustomValidity('');
    hoursError.textContent = '';
    hoursError.hidden = true;

    const weekdays = new Set(weekdayInputs.filter((input) => input.checked).map((input) => Number(input.value)));
    const excludesHolidays = excludeInput.checked;
    let annualDays = 0;
    let annualHours = 0;
    let annualHolidays = 0;
    const monthValues = [];

    cards.forEach((card) => {
      const month = Number(card.dataset.month);
      const holidays = new Set(JSON.parse(card.dataset.holidays));
      const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
      let monthDays = 0;
      let monthHolidays = 0;
      for (let day = 1; day <= lastDay; day += 1) {
        const date = new Date(Date.UTC(year, month - 1, day));
        const weekday = ((date.getUTCDay() + 6) % 7) + 1;
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!weekdays.has(weekday)) continue;
        if (excludesHolidays && holidays.has(dateString)) {
          monthHolidays += 1;
          continue;
        }
        monthDays += 1;
      }

      const monthHours = monthDays * hours;
      monthValues.push({ card, monthDays, monthHours, monthHolidays });
      annualDays += monthDays;
      annualHours += monthHours;
      annualHolidays += monthHolidays;
    });

    const peakDays = Math.max(...monthValues.map((item) => item.monthDays), 1);
    monthValues.forEach(({ card, monthDays, monthHours, monthHolidays }) => {
      card.querySelector('[data-month-days]').textContent = formatter.format(monthDays);
      card.querySelector('[data-month-day-label]').textContent = workdayLabel(monthDays);
      card.querySelector('[data-month-hours]').textContent = formatter.format(monthHours);
      card.querySelector('[data-month-holidays]').textContent = formatter.format(monthHolidays);
      card.style.setProperty('--month-progress', `${Math.round((monthDays / peakDays) * 100)}%`);
      // Visible totals already form the link name and update with the controls.
      card.removeAttribute('aria-label');
    });

    dashboard.querySelector('[data-year-days]').textContent = formatter.format(annualDays);
    dashboard.querySelector('[data-year-days-label]').textContent = `${workdayLabel(annualDays)} v letu`;
    dashboard.querySelector('[data-year-hours]').textContent = formatter.format(annualHours);
    dashboard.querySelector('[data-year-holidays]').textContent = formatter.format(annualHolidays);
  };

  weekdayInputs.forEach((input) => input.addEventListener('change', update));
  excludeInput.addEventListener('change', update);
  hoursInput.addEventListener('input', update);
  controls.querySelector('[data-workdays-reset]').addEventListener('click', () => {
    weekdayInputs.forEach((input) => { input.checked = Number(input.value) <= 5; });
    hoursInput.value = '8';
    hoursInput.setCustomValidity('');
    excludeInput.checked = true;
    update();
  });

  update();
})();
