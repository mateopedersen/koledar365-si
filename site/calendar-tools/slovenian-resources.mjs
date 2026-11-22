const currency = new Intl.NumberFormat('sl-SI', {
  style: 'currency', currency: 'EUR', useGrouping: false
});
const dateFormat = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'long', timeZone: 'UTC' });
const shortDate = new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
const euro = cents => currency.format(cents / 100);
const cents = value => Math.round(Number(String(value).replace(',', '.')) * 100);
const percentage = (value, rate) => Math.round(value * Math.round(rate * 100) / 10000);

function shiftDate(iso, days) {
  const date = new Date(iso + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

const calculators = {
  child(values, rules) {
    const band = rules.limits.findIndex(limit => cents(values.get('income')) <= cents(limit));
    if (band < 0) return [['Osnovni mesečni dodatek po lestvici', euro(0)], ['Dohodkovni razred', 'Nad zgornjo mejo']];
    const amounts = values.get('school') === 'secondary' ? rules.secondary : rules.amounts;
    return [
      ['Osnovni mesečni dodatek', euro(cents(amounts[band][Number(values.get('order'))]))],
      ['Dohodkovni razred', String(band + 1)]
    ];
  },
  kindergarten(values, rules) {
    const index = rules.limits.findIndex(limit => cents(values.get('income')) <= cents(limit));
    const band = index < 0 ? rules.limits.length : index;
    const price = cents(values.get('price'));
    const rate = values.get('exemption') === 'none' ? rules.rates[band] : 0;
    const parentFee = percentage(price, rate);
    return [
      ['Okvirno mesečno plačilo', euro(parentFee)],
      ['Delež staršev', rate + ' %'],
      ['Dohodkovni razred', String(band + 1)]
    ];
  },
  birth(values) {
    return applicationDates(values, 60, '60. dan po rojstvu');
  },
  parent(values) {
    return applicationDates(values, 30, '30. dan po rojstvu');
  },
  leave(values) {
    const transferred = Number(values.get('transfer')) * Number(values.get('days') || 0);
    return [
      ['Predvideni začetek materinskega dopusta', dateFormat.format(shiftDate(values.get('due'), -28))],
      ['Starševski dopust matere', 160 + transferred + ' dni'],
      ['Starševski dopust očeta', 160 - transferred + ' dni']
    ];
  },
  unemployment(values, rules) {
    const base = cents(values.get('base'));
    const minimum = cents(rules.minimum);
    const floor = percentage(minimum, rules.minimum_rate);
    return rules.periods.map(([first, last, rate, cap]) => [
      first + '.–' + last + '. mesec',
      euro(Math.min(percentage(minimum, cap), Math.max(floor, percentage(base, rate)))) + ' bruto'
    ]);
  },
  salary(values, rules) {
    const gross = cents(values.get('gross'));
    const contributions = rules.contribution_rates.reduce((sum, rate) => sum + percentage(gross, rate), 0);
    const health = cents(rules.health_flat);
    const base = Math.max(0, gross - contributions - health - cents(rules.allowance));
    const [threshold, fixed, rate] = [...rules.tax].reverse().find(([lower]) => base > cents(lower)) || rules.tax[0];
    const tax = cents(fixed) + percentage(base - cents(threshold), rate);
    return [
      ['Ocenjena neto plača', euro(gross - contributions - health - tax)],
      ['Prispevki zaposlenega', euro(contributions)],
      ['Zdravstveni prispevek OZP', euro(health)],
      ['Akontacija dohodnine', euro(tax)]
    ];
  },
  annual_tax(values, years) {
    const gross = cents(values.get('gross'));
    const contributions = cents(values.get('contributions'));
    const withheld = cents(values.get('advance'));
    const relief = cents(values.get('relief'));
    if (contributions + withheld > gross) {
      return 'Prispevki in akontacija skupaj ne smejo presegati bruto plač. Preverite letne zneske.';
    }

    const rules = years[values.get('year')];
    const extra = gross <= cents(rules.extra_limit) ? Math.max(0, Math.round(cents(rules.extra_intercept) - rules.extra_factor * gross)) : 0;
    const general = cents(rules.allowance) + extra;
    const taxable = Math.max(0, gross - contributions - general - relief);
    const [threshold, fixed, rate] = [...rules.tax].reverse().find(([lower]) => taxable > cents(lower)) || rules.tax[0];
    const finalTax = cents(fixed) + percentage(taxable - cents(threshold), rate);
    const beforeRefund = gross - contributions - withheld;
    const balance = withheld - finalTax;
    const net = beforeRefund + balance;
    const balanceLabel = balance > 0 ? 'Predvideno vračilo' : balance < 0 ? 'Predvideno doplačilo' : 'Razlika po poračunu';
    return [
      ['Letni neto po poračunu', euro(net)],
      [balanceLabel, euro(Math.abs(balance))],
      ['Ocenjena letna dohodnina', euro(finalTax)],
      ['Neto iz plač pred poračunom', euro(beforeRefund)],
      ['Povprečni mesečni neto po poračunu', euro(Math.round(net / 12))],
      ['Letna davčna osnova', euro(taxable)],
      ['Upoštevana splošna olajšava', euro(general)]
    ];
  },
  vat(values) {
    const amount = cents(values.get('amount'));
    const rate = Number(values.get('rate'));
    const adding = values.get('direction') === 'add';
    const net = adding ? amount : Math.round(amount * 10000 / (10000 + Math.round(rate * 100)));
    const tax = adding ? percentage(net, rate) : amount - net;
    const beforeTax = ['Cena brez DDV', euro(net)];
    const afterTax = ['Cena z DDV', euro(net + tax)];
    return [adding ? afterTax : beforeTax, ['Znesek DDV', euro(tax)], adding ? beforeTax : afterTax];
  }
};

function applicationDates(values, days, lastDayLabel) {
  const result = [];
  const due = values.get('due');
  const birth = values.get('birth');
  if (due) result.push(['Prvi možni dan pred porodom', dateFormat.format(shiftDate(due, -days))]);
  if (birth) result.push([lastDayLabel, dateFormat.format(shiftDate(birth, days))]);
  return result;
}

function showResults(container, rows) {
  if (typeof rows === 'string') {
    container.textContent = rows;
    return;
  }
  if (!rows.length) {
    container.textContent = 'Vnesite vsaj en datum.';
    return;
  }
  const list = document.createElement('dl');
  for (const [label, result] of rows) {
    const tile = document.createElement('div');
    const term = document.createElement('dt');
    const value = document.createElement('dd');
    term.textContent = label;
    value.textContent = result;
    tile.append(term, value);
    list.append(tile);
  }
  container.replaceChildren(list);
}

const calculator = document.querySelector('[data-sl-calculator]');
if (calculator) {
  const form = calculator.querySelector('form');
  const calculate = calculators[calculator.dataset.slCalculator];
  const rules = JSON.parse(calculator.querySelector('[data-sl-rules]').textContent);
  const results = calculator.querySelector('[data-sl-result]');
  const transfer = form.elements.namedItem('transfer');
  for (const input of form.querySelectorAll('[data-minimum]')) {
    const validate = () => {
      input.setCustomValidity('');
      if (input.validity.patternMismatch) {
        input.setCustomValidity('Vnesite znesek z največ dvema decimalnima mestoma.');
      } else if (input.value) {
        const amount = cents(input.value);
        const minimum = cents(input.dataset.minimum);
        const maximum = cents(input.dataset.maximum);
        if (amount < minimum || amount > maximum) {
          input.setCustomValidity('Vnesite znesek med ' + euro(minimum) + ' in ' + euro(maximum) + '.');
        }
      }
    };
    input.addEventListener('input', validate);
    validate();
  }
  if (transfer) transfer.addEventListener('change', () => {
    form.elements.namedItem('days').disabled = transfer.value === '0';
  });
  const birth = form.elements.namedItem('birth');
  if (birth) {
    const currentDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Ljubljana' }).format(new Date());
    birth.max = currentDate;
  }
  const title = calculator.querySelector('[data-sl-result-title]');
  const calculateResult = () => showResults(results, calculate(new FormData(form), rules));
  form.addEventListener('input', () => {
    title.textContent = 'Informativni rezultat';
    results.textContent = 'Ko vnesete podatke, izberite Izračunaj.';
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const annual = form.elements.namedItem('year');
    title.textContent = annual ? (annual.value === '2027' ? 'Projekcija za 2027' : 'Informativna odmera 2026') : 'Informativni rezultat';
    calculateResult();
  });
  form.hidden = false;
  calculator.querySelector('[data-sl-workspace]').hidden = false;
  const hasDates = form.elements.namedItem('due');
  if (hasDates) {
    results.textContent = 'Vnesite datum, da se prikaže koledarski izračun.';
  } else {
    title.textContent = 'Primer izračuna';
    calculateResult();
  }
}

const sky = document.querySelector('[data-sl-sky-calendar]');
if (sky) {
  const year = sky.querySelector('[data-sl-sky-year]');
  const type = sky.querySelector('[data-sl-sky-type]');
  const groups = [...sky.querySelectorAll('[data-sl-sky-group]')];
  const count = sky.querySelector('[data-sl-sky-count]');
  const update = () => {
    let shown = 0;
    for (const group of groups) {
      group.hidden = group.dataset.slSkyGroup !== year.value;
      if (group.hidden) continue;
      for (const row of group.querySelectorAll('[data-sl-sky-row]')) {
        row.hidden = type.value !== 'all' && type.value !== row.dataset.slSkyRow;
        if (!row.hidden) shown += 1;
      }
    }
    count.textContent = 'Prikazano: ' + shown;
  };
  year.addEventListener('change', update);
  type.addEventListener('change', update);
  sky.querySelector('[data-sl-sky-controls]').hidden = false;
  count.hidden = false;
  update();
}

const templates = document.querySelector('[data-sl-templates]');
if (templates) {
  const type = templates.querySelector('[data-sl-template-select]');
  const date = templates.querySelector('[data-sl-template-date]');
  const sheets = templates.querySelectorAll('[data-sl-template-sheet]');
  const update = () => {
    const value = date.validity.valid ? date.value : '';
    const weekday = value ? shiftDate(value, 0).getUTCDay() : null;
    const mondayOffset = weekday === null ? 0 : -((weekday + 6) % 7);
    const dayLabel = offset => value ? shortDate.format(shiftDate(value, mondayOffset + offset)) : '';
    for (const sheet of sheets) {
      sheet.hidden = sheet.dataset.slTemplateSheet !== type.value;
      sheet.querySelector('[data-sl-template-week]').textContent = value
        ? dateFormat.format(shiftDate(value, mondayOffset)) + ' – ' + dateFormat.format(shiftDate(value, mondayOffset + 6))
        : '__________________';
      for (const day of sheet.querySelectorAll('[data-sl-day]')) {
        day.textContent = dayLabel(Number(day.dataset.slDay));
      }
    }
  };
  type.addEventListener('change', update);
  date.addEventListener('input', update);
  templates.querySelector('[data-sl-print]').addEventListener('click', () => {
    if (date.reportValidity()) window.print();
  });
  templates.querySelector('[data-sl-template-controls]').hidden = false;
  update();
}
