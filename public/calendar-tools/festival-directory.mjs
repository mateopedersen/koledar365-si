const directory = document.querySelector('[data-festival-directory]');
const form = directory?.querySelector('[data-festival-filters]');

if (form) {
  const controls = ['q', 'kraj', 'vrsta', 'leto'].map(name => form.elements.namedItem(name));
  const [search, place, kind, year] = controls;
  const fold = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const cards = [...directory.querySelectorAll('[data-festival-card]')].map(element => ({
    element,
    dates: [...element.querySelectorAll('[data-festival-date]')],
    search: fold(element.dataset.search),
    places: element.dataset.place.split(' '),
    years: element.dataset.years.split(' '),
  }));
  const counter = directory.querySelector('[data-festival-count]');
  const empty = directory.querySelector('[data-festival-empty]');
  const agenda = directory.querySelector('[data-festival-agenda]');

  function render(updateUrl = true) {
    const terms = fold(search.value).trim().split(/\s+/);
    let visible = 0;
    for (const card of cards) {
      const matches = (!place.value || card.places.includes(place.value)) &&
        (!kind.value || card.element.dataset.kind === kind.value) &&
        (!year.value || card.years.includes(year.value)) && terms.every(term => card.search.includes(term));
      card.element.hidden = !matches;
      if (matches) {
        visible++;
        for (const date of card.dates) date.hidden = date.dataset.festivalDate !== year.value;
      }
    }
    counter.textContent = `Prikazane prireditve: ${visible}`;
    empty.hidden = visible !== 0;
    if (agenda) agenda.hidden = controls.some(control => control.value.trim());
    if (updateUrl) {
      const url = new URL(window.location.href);
      for (const control of controls) {
        const value = control.value.trim();
        if (value) url.searchParams.set(control.name, value);
        else url.searchParams.delete(control.name);
      }
      if (url.href !== window.location.href) history.replaceState(history.state, '', url);
    }
  }

  function restore() {
    const params = new URLSearchParams(window.location.search);
    for (const control of controls) {
      const value = params.get(control.name) || '';
      control.value = control.options ? value : value.slice(0, 100);
      if (control.options && control.selectedIndex < 0) control.value = '';
    }
    render(false);
  }

  search.addEventListener('input', () => render());
  form.addEventListener('change', () => render());
  form.addEventListener('submit', event => { event.preventDefault(); render(); });
  form.addEventListener('reset', event => {
    event.preventDefault();
    for (const control of controls) control.value = '';
    render();
    search.focus();
  });
  window.addEventListener('popstate', restore);
  restore();
  form.hidden = false;
}
