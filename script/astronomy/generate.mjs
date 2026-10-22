#!/usr/bin/env node
// Reproducible, network-free ephemerides. The vendored MIT Astronomy Engine
// computes geometry; published Slovenian observations independently check it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import * as A from '../../lib/horoscope/vendor/astronomy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DAY = 86400000;
const zone = 'Europe/Ljubljana';
const years = [2026, 2027, 2028, 2029, 2030];
const ids = ['ljubljana', 'maribor', 'koper', 'celje', 'kranj', 'novo-mesto', 'nova-gorica', 'murska-sobota'];
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/cities_sl.json'))).cities;
const cities = ids.map(id => {
  const c = catalog.find(row => row.id === id);
  if (!c) throw new Error(`Missing city ${id}`);
  const p = c.coordinates[0];
  return { id, name: c.name, latitude: p.lat, longitude: p.lon, elevation: 0 };
});
const observer = c => new A.Observer(c.latitude, c.longitude, c.elevation);
const iso = t => (t?.date || t)?.toISOString() ?? null;
const round = n => Math.round(n * 10) / 10;
const localDate = t => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(t.date || t);
const contacts = (e, body, o) => Object.fromEntries(Object.entries(e).filter(([, t]) => t).map(([key, t]) => {
  const time = t.time || t;
  const eq = A.Equator(body, time, o, true, true);
  const h = A.Horizon(time, o, eq.ra, eq.dec, 'normal');
  return [key, { utc: iso(time), altitude: round(h.altitude), azimuth: round(h.azimuth) }];
}));

// Intersect an event with the upper-limb rise/set interval. SearchRiseSet includes
// standard atmospheric refraction. No mountains, buildings, weather or terrain.
function aboveHorizon(body, o, start, end) {
  const s = new Date(start), e = new Date(end);
  const before = new Date(s.getTime() - DAY * 1.5);
  let rise = A.SearchRiseSet(body, o, 1, before, 3);
  const windows = [];
  let firstRise = null, firstSet = null;
  for (let n = 0; rise && n < 4; n++) {
    const set = A.SearchRiseSet(body, o, -1, rise, 2);
    if (!set) break;
    const a = Math.max(s.getTime(), rise.date.getTime());
    const b = Math.min(e.getTime(), set.date.getTime());
    if (a < b) windows.push({ start: iso(new Date(a)), end: iso(new Date(b)) });
    if (rise.date >= s && rise.date <= e) firstRise = iso(rise);
    if (set.date >= s && set.date <= e) firstSet = iso(set);
    if (set.date > e) break;
    rise = A.SearchRiseSet(body, o, 1, set, 2);
  }
  return { windows, rise: firstRise, set: firstSet };
}
const within = (utc, windows) => windows.some(w => utc >= w.start && utc <= w.end);
const intersects = (a, b, windows) => windows.some(w => a < w.end && b > w.start);
function altitudeTrack(body, o, start, end) {
  const a = new Date(start).getTime(), b = new Date(end).getTime();
  const points = [];
  for (let n = 0; n <= 32; n++) {
    const t = new Date(a + (b - a) * n / 32);
    const eq = A.Equator(body, t, o, true, true);
    const h = A.Horizon(t, o, eq.ra, eq.dec, 'normal');
    points.push([iso(t), round(h.altitude)]);
  }
  return points;
}
function lunarContacts(e) {
  const shift = n => e.peak.AddDays(n / 1440);
  return {
    penumbral_begin: shift(-e.sd_penum),
    partial_begin: e.sd_partial ? shift(-e.sd_partial) : null,
    total_begin: e.sd_total ? shift(-e.sd_total) : null,
    peak: e.peak,
    total_end: e.sd_total ? shift(e.sd_total) : null,
    partial_end: e.sd_partial ? shift(e.sd_partial) : null,
    penumbral_end: shift(e.sd_penum)
  };
}
function lunarEvents() {
  const out = [];
  let e = A.SearchLunarEclipse(new Date('2026-01-01T00:00:00Z'));
  while (e.peak.date.getUTCFullYear() <= 2030) {
    const c = lunarContacts(e), date = localDate(e.peak);
    const row = { id: `lunar-${date}`, date, year: +date.slice(0, 4), kind: e.kind, peak: iso(e.peak), contacts: Object.fromEntries(Object.entries(c).filter(([, t]) => t).map(([k,t]) => [k, iso(t)])), cities: {} };
    for (const city of cities) {
      const o = observer(city);
      const visibility = aboveHorizon(A.Body.Moon, o, iso(c.penumbral_begin), iso(c.penumbral_end));
      let visibleKind = null;
      if (visibility.windows.length) visibleKind = 'penumbral';
      if (c.partial_begin && intersects(iso(c.partial_begin), iso(c.partial_end), visibility.windows)) visibleKind = 'partial';
      if (c.total_begin && intersects(iso(c.total_begin), iso(c.total_end), visibility.windows)) visibleKind = 'total';
      const stages = contacts(c, A.Body.Moon, o);
      for (const stage of Object.values(stages)) stage.above_horizon = within(stage.utc, visibility.windows);
      row.cities[city.id] = { visible: !!visibleKind, kind: visibleKind, peak_visible: within(row.peak, visibility.windows), contacts: stages, track: visibleKind ? altitudeTrack(A.Body.Moon, o, iso(c.penumbral_begin), iso(c.penumbral_end)) : [], ...visibility };
    }
    out.push(row);
    e = A.NextLunarEclipse(e.peak);
  }
  return out;
}
function solarEvents() {
  const out = [];
  let e = A.SearchGlobalSolarEclipse(new Date('2026-01-01T00:00:00Z'));
  while (e.peak.date.getUTCFullYear() <= 2030) {
    const date = localDate(e.peak);
    out.push({ id: `solar-${date}`, date, year: +date.slice(0, 4), kind: e.kind, peak: iso(e.peak), cities: Object.fromEntries(cities.map(c => [c.id, { visible: false, windows: [], contacts: {} }])) });
    e = A.NextGlobalSolarEclipse(e.peak);
  }
  for (const city of cities) {
    const o = observer(city);
    let local = A.SearchLocalSolarEclipse(new Date('2026-01-01T00:00:00Z'), o);
    while (local.peak.time.date.getUTCFullYear() <= 2030) {
      const row = out.find(g => Math.abs(new Date(g.peak) - local.peak.time.date) < DAY);
      if (!row) throw new Error('Local eclipse missing from global list');
      const stages = contacts({ partial_begin: local.partial_begin, total_begin: local.total_begin, peak: local.peak, total_end: local.total_end, partial_end: local.partial_end }, A.Body.Sun, o);
      const visibility = aboveHorizon(A.Body.Sun, o, stages.partial_begin.utc, stages.partial_end.utc);
      for (const stage of Object.values(stages)) stage.above_horizon = within(stage.utc, visibility.windows);
      const centralVisible = stages.total_begin && intersects(stages.total_begin.utc, stages.total_end.utc, visibility.windows);
      const visibleKind = centralVisible ? local.kind : 'partial';
      row.cities[city.id] = { visible: visibility.windows.length > 0, kind: visibleKind, geometric_kind: local.kind, peak_visible: within(stages.peak.utc, visibility.windows), peak_obscuration: Math.round(local.obscuration * 1000) / 10, contacts: stages, track: altitudeTrack(A.Body.Sun, o, stages.partial_begin.utc, stages.partial_end.utc), ...visibility };
      local = A.NextLocalSolarEclipse(local.peak.time, o);
    }
  }
  return out;
}
function complement(start, end, windows) {
  const out = [];
  let cursor = start;
  for (const w of windows) {
    if (cursor < w.start) out.push({ start: cursor, end: w.start });
    cursor = w.end;
  }
  if (cursor < end) out.push({ start: cursor, end });
  return out;
}
function perseidNights() {
  return years.map(year => ({ year, peak_prediction: null, nights: [11,12,13].map(day => {
    const date = `${year}-08-${day}`;
    const midnight = new Date(`${year}-08-${day+1}T00:00:00+02:00`);
    const row = { id: `perseids-${date}`, date, moon_illumination: Math.round(A.Illumination(A.Body.Moon, midnight).phase_fraction * 100), cities: {} };
    for (const city of cities) {
      const o = observer(city), afternoon = new Date(`${date}T12:00:00Z`);
      const dusk = A.SearchAltitude(A.Body.Sun, o, -1, afternoon, 1, -18);
      const dawn = A.SearchAltitude(A.Body.Sun, o, 1, dusk, 1, -18);
      if (!dusk || !dawn) throw new Error('Expected astronomical night in Slovenia in August');
      const visibility = aboveHorizon(A.Body.Moon, o, iso(dusk), iso(dawn));
      row.cities[city.id] = { dark_start: iso(dusk), dark_end: iso(dawn), moonrise: visibility.rise, moonset: visibility.set, moon_free: complement(iso(dusk), iso(dawn), visibility.windows) };
    }
    return row;
  }) }));
}

function validate() {
  const checks = [];
  const check = (name, actual, expected, tolerance) => {
    const delta = Math.abs((new Date(actual) - new Date(expected)) / 1000);
    if (delta > tolerance) throw new Error(`${name}: ${delta.toFixed(1)}s > ${tolerance}s`);
    checks.push({ name, expected, calculated: iso(new Date(actual)), difference_seconds: Math.round(delta * 10) / 10, tolerance_seconds: tolerance });
  };
  // Primary Slovenian sources: Orion, Igor Žiberna (2026-08-06), and Cosmolab.
  for (const [id, start, peak] of [['ljubljana','19:25:27','20:17:22'],['maribor','19:24:25','20:16:10'],['koper','19:26:24','20:18:26'],['murska-sobota','19:24:08','20:15:48']]) {
    const c = cities.find(c => c.id === id), e = A.SearchLocalSolarEclipse(new Date('2026-08-01T00:00:00Z'), observer(c));
    check(`${id}: solar first contact`, e.partial_begin.time.date, `2026-08-12T${start}+02:00`, 60);
    check(`${id}: geometric local maximum`, e.peak.time.date, `2026-08-12T${peak}+02:00`, 60);
  }
  const maribor = observer(cities.find(c => c.id === 'maribor'));
  check('Maribor: sunset', A.SearchRiseSet(A.Body.Sun, maribor, -1, new Date('2026-08-12T12:00:00Z'), 1).date, '2026-08-12T20:12:22+02:00', 60);
  const e = A.SearchLunarEclipse(new Date('2025-09-01T00:00:00Z')), c = lunarContacts(e);
  for (const [key,time] of [['penumbral_begin','17:28'],['partial_begin','18:27'],['total_begin','19:31'],['peak','20:12'],['total_end','20:53'],['partial_end','21:57'],['penumbral_end','22:56']]) check(`2025 lunar ${key}`, c[key].date, `2025-09-07T${time}:00+02:00`, 90);
  const l26 = A.SearchLunarEclipse(new Date('2026-08-01T00:00:00Z'));
  check('2026 lunar maximum', l26.peak.date, '2026-08-28T06:12:27+02:00', 60);
  return checks;
}

const validation = validate();
const data = {
  metadata: {
    verified_on: '2026-10-21', time_zone: zone, years, engine: 'Astronomy Engine 2.1.19 (vendored MIT)', engine_source: 'https://github.com/cosinekitty/astronomy',
    engine_sha256: createHash('sha256').update(fs.readFileSync(path.join(root, 'lib/horoscope/vendor/astronomy.mjs'))).digest('hex'),
    coordinate_catalog: 'data/cities_sl.json; eight city centres; zero elevation for the stated flat-horizon model',
    reference_sources: [
      { name: 'Astronomsko društvo Orion, Igor Žiberna, 6. avgust 2026', language: 'sl', url: 'https://adorionmb.splet.arnes.si/2026/08/06/nekaj-zanimivih-astronomskih-dogodkov-v-noci-z-12-na-13-avgust-2026-in-javno-opazovanje-v-organizaciji-astronomskega-drustva-orion/' },
      { name: 'Cosmolab: potek Luninega mrka 7. septembra 2025', language: 'sl', url: 'https://cosmolab.si/projekti/Lunin%20mrk%202025' }
    ],
    precision: 'Rounded to the nearest minute in the interface; calculated estimates, not measured observing conditions.',
    horizon: 'Flat unobstructed horizon, zero elevation, standard refraction and upper-limb rise/set; mountains, buildings and weather excluded.',
    lunar_contacts: 'Contact times are symmetric about maximum using Astronomy Engine semi-durations; independent reference error under 90 seconds.',
    meteor_peak: 'No exact annual peak predicted. August 11/12, 12/13 and 13/14 are planning nights, not an annual maximum ephemeris.',
    validation
  }, cities, solar: solarEvents(), lunar: lunarEvents(), perseids: perseidNights()
};
const outDir = path.join(root, 'data/astronomy');
fs.mkdirSync(outDir, { recursive: true });
const destination = path.join(outDir, 'events-2026-2030.json');
fs.writeFileSync(destination, JSON.stringify(data, null, 2) + '\n');
console.log(`${data.solar.length} solar eclipses, ${data.lunar.length} lunar eclipses, ${data.perseids.length * 3} planning nights, ${cities.length} cities; ${validation.length} independent checks passed.`);
console.log(destination);
