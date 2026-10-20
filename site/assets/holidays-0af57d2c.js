'use strict';
{
  const form = document.getElementById('holiday-filters');
  if (form) {
    const page = document.querySelector('[data-holiday-year]');
    const year = Number(page.dataset.holidayYear);
    const rows = [...page.querySelectorAll('[data-holiday-row]')];
    const groups = [...page.querySelectorAll('[data-holiday-month]')];
    const checkInput = document.getElementById('holiday-check-date');
    const result = document.getElementById('holiday-check-result');
    const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('sl').trim();
    const dateFormat = new Intl.DateTimeFormat('sl-SI', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
    const eventsByDate = new Map(rows.map(row => [row.dataset.date, {
      free: row.dataset.free === 'true',
      title: row.querySelector('.holiday-name').textContent.trim()
    }]));
    const setCheckResult = (state, title, description) => {
      result.dataset.status = state;
      document.getElementById('holiday-check-status').textContent = title;
      document.getElementById('holiday-check-description').textContent = description;
    };
    const checkDate = () => {
      const value = checkInput.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        setCheckResult('invalid', 'Izberite datum.', `Preverite poljuben dan v letu ${year}.`);
        return;
      }
      const date = new Date(value + 'T12:00:00Z');
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || date.getUTCFullYear() !== year) {
        setCheckResult('invalid', `Izberite datum v letu ${year}.`, 'Za drugo leto uporabite izbiro leta na vrhu strani.');
        return;
      }
      const event = eventsByDate.get(value);
      const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
      const description = dateFormat.format(date);
      if (event?.free) setCheckResult('free', 'Dela prost dan', `${event.title} · ${description}`);
      else if (weekend) setCheckResult('weekend', 'Konec tedna', `${event ? event.title + ' · ni dela prost praznik · ' : 'Ni dela prost praznik · '}${description}`);
      else setCheckResult('working', 'Običajen delovni dan', `${event ? event.title + ' · ni dela prost dan · ' : 'Ni zakonsko določen dela prost dan · '}${description}`);
    };
    const remember = () => {
      const data = new FormData(form);
      const params = new URLSearchParams();
      const month = Number(data.get('month'));
      if (month >= 1 && month <= 12) params.set('month', month);
      if (['free', 'working'].includes(data.get('kind'))) params.set('kind', data.get('kind'));
      if (data.get('q')) params.set('q', String(data.get('q')).slice(0, 100));
      // The generic hub may have been hydrated with ?year=2028; filters must retain it.
      if (location.pathname === '/prazniki/' && year !== 2027) params.set('year', year);
      if (checkInput.value && checkInput.value !== checkInput.defaultValue) params.set('check', checkInput.value);
      history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}${location.hash}`);
    };
    const update = ({save = true} = {}) => {
      const data = new FormData(form);
      const rawMonth = Number(data.get('month'));
      const month = rawMonth >= 1 && rawMonth <= 12 ? rawMonth : 0;
      const kind = ['free', 'working'].includes(data.get('kind')) ? data.get('kind') : 'all';
      const query = normalize(String(data.get('q') || '').slice(0, 100));
      let count = 0;
      for (const row of rows) {
        row.hidden = (month > 0 && Number(row.dataset.month) !== month) ||
          (kind === 'free' && row.dataset.free !== 'true') ||
          (kind === 'working' && row.dataset.free === 'true') ||
          !row.dataset.search.includes(query);
        if (!row.hidden) count++;
      }
      for (const group of groups) group.hidden = ![...group.querySelectorAll('[data-holiday-row]')].some(row => !row.hidden);
      document.getElementById('holiday-shown-count').textContent = count;
      document.getElementById('holiday-empty').hidden = count > 0;
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (kind !== 'all') params.set('kind', kind);
      if (data.get('q')) params.set('q', String(data.get('q')).slice(0, 100));
      const ics = document.getElementById('holiday-ics');
      ics.href = `/prazniki/${year}.ics?${params}`;
      ics.setAttribute('aria-disabled', String(!count));
      ics.tabIndex = count ? 0 : -1;
      for (const link of page.querySelectorAll('[data-select-holiday-month]')) {
        if (Number(link.dataset.selectHolidayMonth) === month) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      document.getElementById('holiday-share-status').textContent = '';
      if (save) remember();
    };
    form.addEventListener('submit', event => { event.preventDefault(); update(); });
    form.addEventListener('input', () => update());
    form.addEventListener('change', () => update());
    document.getElementById('holiday-ics').addEventListener('click', event => {
      if (event.currentTarget.getAttribute('aria-disabled') === 'true') event.preventDefault();
    });
    document.getElementById('holiday-reset').addEventListener('click', event => {
      event.preventDefault();
      form.elements.kind.value = 'all'; form.elements.month.value = '0'; form.elements.q.value = '';
      update();
    });
    for (const link of page.querySelectorAll('[data-select-holiday-month]')) {
      link.addEventListener('click', event => {
        event.preventDefault();
        form.elements.month.value = link.dataset.selectHolidayMonth;
        form.elements.kind.value = 'all'; form.elements.q.value = '';
        update();
        document.getElementById('prazniki-seznam').scrollIntoView({behavior: 'instant', block: 'start'});
        form.elements.month.focus({preventScroll: true});
      });
    }
    const requestedDate = new URLSearchParams(location.search).get('check');
    if (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate || '')) checkInput.value = requestedDate;
    checkInput.addEventListener('input', () => { checkDate(); remember(); });
    checkInput.addEventListener('change', () => { checkDate(); remember(); });
    document.getElementById('holiday-share').addEventListener('click', async () => {
      const status = document.getElementById('holiday-share-status');
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(location.href);
        status.textContent = 'Povezava je kopirana. Vključuje izbrani mesec, filtre in datum.';
      } catch {
        status.textContent = `Kopirajte povezavo iz naslovne vrstice: ${location.href}`;
      }
    });
    checkDate();
    update({save: false});
  }
}
