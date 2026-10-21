import test from 'node:test';
import assert from 'node:assert/strict';
import {nextClockChange} from '../public/premik-ure/experience.mjs';

const changes=[
  {date:'2026-10-25',instant:'2026-10-25T01:00:00Z'},
  {date:'2027-03-28',instant:'2027-03-28T01:00:00Z'},
  {date:'2027-10-31',instant:'2027-10-31T01:00:00Z'}
];
test('an already open page advances exactly at the autumn transition',()=>{
  assert.equal(nextClockChange(changes,Date.parse('2026-10-25T02:59:59+02:00')).date,'2026-10-25');
  assert.equal(nextClockChange(changes,Date.parse('2026-10-25T02:00:00+01:00')).date,'2027-03-28');
});
test('spring skips the missing local hour and ignores the visitor timezone',()=>{
  assert.equal(nextClockChange(changes,Date.parse('2027-03-28T01:59:59+01:00')).date,'2027-03-28');
  assert.equal(nextClockChange(changes,Date.parse('2027-03-28T03:00:00+02:00')).date,'2027-10-31');
  assert.equal(nextClockChange(changes,Date.parse('2027-03-27T18:00:00-07:00')).date,'2027-10-31');
});
test('exhausted and empty schedules do not present an old date as next',()=>{
  assert.equal(nextClockChange(changes,Date.parse('2027-10-31T01:00:00Z')),null);
  assert.equal(nextClockChange([],Date.now()),null);
});
