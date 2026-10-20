'use strict';
{
  const form = document.getElementById('holiday-filters');
  if (form) {
    const page = document.querySelector('[data-holiday-year]');
    const rows = [...page.querySelectorAll('[data-holiday-row]')];
    const groups = [...page.querySelectorAll('[data-holiday-month]')];
    const normalize = value => value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('sl').trim();
    const update = ({remember = true} = {}) => {
      const data = new FormData(form);
      const month = Number(data.get('month'));
      const kind = data.get('kind');
      const query = normalize(data.get('q') || '');
      let count = 0;
      for (const row of rows) {
        row.hidden = (month > 0 && Number(row.dataset.month) !== month) ||
          (kind === 'free' && row.dataset.free !== 'true') ||
          (kind === 'working' && row.dataset.free === 'true') ||
          !row.dataset.search.includes(query);
        if (!row.hidden) count++;
      }
      for (const group of groups) group.hidden = ![...group.querySelectorAll('[data-holiday-row]')].some(row => !row.hidden);
      document.getElementById('holiday-result-count').textContent = `Prikazani datumi: ${count} od ${rows.length}`;
      document.getElementById('holiday-empty').hidden = count > 0;
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (kind !== 'all') params.set('kind', kind);
      if (data.get('q')) params.set('q', data.get('q'));
      const ics = document.getElementById('holiday-ics');
      ics.href = `/prazniki/${page.dataset.holidayYear}.ics?${params}`;
      ics.setAttribute('aria-disabled', String(!count));
      ics.tabIndex = count ? 0 : -1;
      for (const link of page.querySelectorAll('[data-select-holiday-month]')) {
        if (Number(link.dataset.selectHolidayMonth) === month) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
      if (remember) history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}${location.hash}`);
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
        document.getElementById('prazniki-seznam').scrollIntoView({behavior: 'auto', block: 'start'});
        form.elements.month.focus({preventScroll: true});
      });
    }
    update({remember: false});
  }
}
