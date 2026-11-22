import test from 'node:test';
import assert from 'node:assert/strict';
import { civilDate, retirementPaths, pensionAmount, studyPlan, calendarDocument } from '../public/calendar-tools/local-tools-core.mjs';

test('pension eligibility uses age effective in the qualifying year and both service paths', () => {
  const paths = retirementPaths({ birth: '1968-02-10', years15: '2004-02-10', years40: '2028-02-10' });
  assert.deepEqual(paths.map(({ date, minYears, ageMonths }) => [date, minYears, ageMonths]), [
    ['2028-05-10', 40, 723], ['2034-11-10', 15, 801]
  ]);
  const before2028 = retirementPaths({ birth: '1967-12-31', years40: '2027-12-31' });
  assert.equal(before2028[0].date, '2027-12-31');
  const after = retirementPaths({ birth: '1973-02-28', years40all: '2034-01-01' });
  assert.equal(after[0].date, '2035-02-28');
  assert.throws(() => retirementPaths({ birth: '2010-01-01', years40: '2027-01-01' }));
  assert.equal(civilDate('2027-02-29'), null);
});

test('pension amounts use the separate statutory half-year increments', () => {
  assert.deepEqual(pensionAmount(2027, 1600, 40, 0), { rate: 63.5, amount: 1016 });
  assert.deepEqual(pensionAmount(2028, 1600, 40, 0), { rate: 64.75, amount: 1036 });
  assert.deepEqual(pensionAmount(2030, 1000, 18, 6), { rate: 35.08, amount: 350.8 });
  assert.deepEqual(pensionAmount(2035, 1000, 40, 5), { rate: 70, amount: 700 });
});

test('study dates exclude the exam unless requested and minutes add up exactly', () => {
  const form = { start: '2027-05-28', end: '2027-06-01', strategy: 'workweek', hours: 2.5 };
  const plan = studyPlan(form);
  assert.deepEqual(plan.days, [{ date: '2027-05-28', minutes: 75 }, { date: '2027-05-31', minutes: 75 }]);
  const extra = studyPlan({ ...form, include: true });
  assert.equal(extra.days.at(-1).date, form.end);
  assert.equal(extra.weeks.reduce((sum, week) => sum + week.minutes, 0), 150);
});

test('calendar exports retain inclusive event days and fold international text safely', () => {
  const title = 'Š'.repeat(85) + ';\nDolgi dnevi';
  const body = calendarDocument([{ date: '2027-02-12', end: '2027-02-13', title }], new Date('2026-11-22T12:00:00Z'));
  assert.match(body, /DTEND;VALUE=DATE:20270214/);
  assert.ok(body.split('\r\n').every(line => Buffer.byteLength(line) <= 75));
  assert.ok(body.replace(/\r\n /g, '').includes('SUMMARY:' + 'Š'.repeat(85) + '\\;\\nDolgi dnevi'));
});
