(() => {
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
      card.setAttribute('aria-label', `${card.querySelector('h3').textContent}: ${formatter.format(monthDays)} ${workdayLabel(monthDays)}, ${formatter.format(monthHours)} ur, ${formatter.format(monthHolidays)} izločenih praznikov`);
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
