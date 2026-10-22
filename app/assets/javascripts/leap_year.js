(() => {
  const root = document.querySelector('[data-leap-tool]');
  if (!root) return;

  const form = root.querySelector('[data-leap-form]');
  const input = root.querySelector('[data-leap-input]');
  const answer = root.querySelector('[data-leap-answer]');
  const calendarLink = root.querySelector('[data-leap-calendar-link]');
  const presets = Array.from(root.querySelectorAll('[data-leap-preset]'));
  const byFour = year => year % 4 === 0;
  const byHundred = year => year % 100 === 0;
  const byFourHundred = year => year % 400 === 0;
  const isLeap = year => byFour(year) && (!byHundred(year) || byFourHundred(year));

  function nextLeapYear(year) {
    for (let candidate = year + 1; candidate <= 9999; candidate += 1) {
      if (isLeap(candidate)) return String(candidate);
    }
    return 'Po letu 9999';
  }

  function render(year) {
    if (!Number.isSafeInteger(year) || year < 1 || year > 9999) {
      input.setCustomValidity('Vnesite celo leto med 1 in 9999.');
      input.reportValidity();
      return false;
    }

    input.setCustomValidity('');
    const leap = isLeap(year);
    const februaryDays = leap ? 29 : 28;
    answer.dataset.isLeap = String(leap);
    answer.querySelector('[data-leap-year]').textContent = String(year);
    answer.querySelector('[data-leap-summary-year]').textContent = String(year);
    answer.querySelector('[data-leap-status]').textContent = leap ? 'Prestopno leto' : 'Običajno leto';
    answer.querySelector('[data-leap-days]').textContent = leap ? '366' : '365';
    answer.querySelector('[data-leap-feb]').textContent = String(februaryDays);
    answer.querySelector('[data-leap-next]').textContent = nextLeapYear(year);
    const hasPublishedCalendar = year >= 2027 && year <= 2030;
    calendarLink.hidden = !hasPublishedCalendar;
    if (hasPublishedCalendar) {
      calendarLink.href = `/koledar/${year}/`;
      calendarLink.querySelector('[data-leap-calendar-label]').textContent = `Odprite koledar ${year}`;
    }

    presets.forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.leapPreset) === year));
    });
    return true;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render(Number(input.value));
  });

  presets.forEach(button => button.addEventListener('click', () => {
    input.value = button.dataset.leapPreset;
    render(Number(input.value));
    input.focus();
  }));

  const queryYear = new URLSearchParams(window.location.search).get('leto');
  if (queryYear && /^\d{1,4}$/.test(queryYear)) {
    input.value = queryYear;
    render(Number(queryYear));
  } else {
    render(Number(input.value));
  }
})();
