import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSearchText, parseDateQuery, resultCategory, searchRecords } from '../../cloudflare/free/site-search.mjs';

const index = [
  { title: 'Prazniki in dela prosti dnevi', path: '/prazniki/', folded: 'prazniki drzavni praznik dela prost dan dela prosti dnevi', priority: 0 },
  { title: 'Božič', path: '/prazniki/bozic/', folded: 'bozic 2027-12-25 25 december 2027 ponedeljek praznik dela prost dan', priority: -2 },
  { title: 'Ime: Žan', path: '/koledar-z-imenom/zan/', folded: 'zan ime koledar z imenom', priority: 5 },
  { title: 'Koledar 2028', path: '/koledar/2028/', folded: 'koledar 2028 datum mesec leto', priority: 0 },
  { title: 'Sončni vzhod in zahod – Ljubljana', path: '/soncni-vzhod-in-zahod/ljubljana/', folded: 'ljubljana soncni vzhod zahod zlata ura', priority: 1 }
];

test('normalizes Slovenian accents, punctuation, and diacritics', () => {
  assert.equal(normalizeSearchText('Počitnice – šolski koledar!'), 'pocitnice solski koledar');
});

test('finds exact pages, event descriptions, unaccented names, and a one-letter typo', () => {
  assert.equal(searchRecords(index, 'prazniki').results[0].path, '/prazniki/');
  assert.ok(searchRecords(index, 'dela prost dan').results.some(row => row.path === '/prazniki/bozic/'));
  assert.equal(searchRecords(index, 'zan').results[0].title, 'Ime: Žan');
  assert.ok(searchRecords(index, 'praznikii').results.some(row => row.path === '/prazniki/'));
});

test('ranks cities, dates, and categories correctly', () => {
  assert.equal(searchRecords(index, 'ljubljana').results[0].category, 'Sončni časi');
  assert.equal(resultCategory({ path: '/koledar/2028/' }), 'Koledarji');
  assert.equal(parseDateQuery('25. december 2027').path, '/?year=2027&month=12&date=2027-12-25&view=day');
  assert.equal(parseDateQuery('2027-02-30'), null);
  assert.equal(parseDateQuery('1. januar 2026'), null);
});

test('deduplicates by destination and respects the result limit', () => {
  const repeated = [index[0], { ...index[0], title: 'Prazniki v Sloveniji' }];
  const { results, total } = searchRecords(repeated, 'prazniki', { limit: 1 });
  assert.equal(results.length, 1);
  assert.equal(total, 1);
});
