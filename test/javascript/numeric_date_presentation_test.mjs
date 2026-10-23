import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {compactNumericDates} from '../../public/calendar-tools/mobile-layout.mjs';
const cases=JSON.parse(fs.readFileSync(new URL('../fixtures/files/numeric_dates.json',import.meta.url),'utf8'));
for(const row of cases)test('compact numeric date: '+row.input,()=>assert.equal(compactNumericDates(row.input),row.output));
