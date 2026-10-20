'use strict';
const assert = require('node:assert/strict');
const planner = require('../app/assets/javascripts/vacation.js');

const uprisingDay = { date: '2027-04-27', title: 'Dan upora proti okupatorju' };
const bridge = planner.buildOptions(2027, 1, [uprisingDay]).find(option => option.from === '2027-04-24' && option.to === '2027-04-27');
assert.ok(bridge, 'Saturday through the Tuesday holiday should be a four-day break');
assert.equal(bridge.totalDays, 4);
assert.equal(bridge.leaveDays, 1);
assert.deepEqual(bridge.leaveDates, ['2027-04-26']);
assert.deepEqual(bridge.holidayNames, ['Dan upora proti okupatorju']);

const weekendHolidayOptions = planner.buildOptions(2027, 0, [{ date: '2027-01-02', title: 'Novo leto' }]);
assert.equal(weekendHolidayOptions.length, 0, 'a Saturday holiday must not move to Monday');

const leapOptions = planner.buildOptions(2028, 1, [
  { date: '2028-02-28', title: 'Praznik' },
  { date: '2028-03-01', title: 'Praznik' }
]);
assert.ok(leapOptions.some(option => option.from === '2028-02-26' && option.to === '2028-03-01' && option.leaveDays === 1 && option.leaveDates.includes('2028-02-29')));

const annual = planner.calculate(2027, 5, [uprisingDay, { date: '2027-06-25', title: 'Dan državnosti' }]);
assert.ok(annual.optimized.leaveDays <= 5, 'the optimized plan must remain within the selected budget');
for (let index = 1; index < annual.optimized.periods.length; index += 1) {
  assert.ok(annual.optimized.periods[index - 1].toIndex < annual.optimized.periods[index].fromIndex, 'optimized breaks must not overlap');
}
assert.ok(annual.suggestions.length <= 6);
console.log(`Vacation planner rules passed (${annual.options.length} candidate periods checked).`);
