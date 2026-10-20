import cities from './cities.js';

const normalize = value => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const aliases = new Map([
  ['marburg an der drau', 'maribor'],
  ['capodistria', 'koper'],
  ['novo mesto', 'novo-mesto'],
  ['slovenj gradec', 'slovenj-gradec'],
  ['slovenska bistrica', 'slovenska-bistrica'],
  ['murska sobota', 'murska-sobota'],
  ['nova gorica', 'nova-gorica'],
  ['skofja loka', 'skofja-loka'],
  ['crnomelj', 'crnomelj'],
  ['lendva', 'lendava'],
]);

const byId = new Map(cities.map(city => [city.id, city]));
const byName = new Map(cities.map(city => [normalize(city.name), city]));
const EARTH_RADIUS_KM = 6371;

function cityFromName(value) {
  const name = normalize(value);
  return byName.get(name) || byId.get(aliases.get(name));
}

function distanceKm(aLat, aLon, bLat, bLon) {
  const rad = degrees => degrees * Math.PI / 180;
  const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon);
  const value = Math.sin(dLat / 2) ** 2
    + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, value)));
}

function nearbyCity(latitude, longitude) {
  const lat = Number(latitude), lon = Number(longitude);
  // Ignore missing, malformed, or clearly out-of-country edge metadata.
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 45.35 || lat > 46.95 || lon < 13.25 || lon > 16.75) return null;
  let best = null;
  for (const city of cities) {
    const point = city.coordinates?.[0];
    if (!point) continue;
    const km = distanceKm(lat, lon, point.lat, point.lon);
    if (!best || km < best.km) best = { city, km };
  }
  return best && best.km <= 25 ? best.city : null;
}

export async function onRequestGet({ request }) {
  const edge = request.cf && typeof request.cf === 'object' ? request.cf : {};
  const country = typeof edge.country === 'string' ? edge.country.toUpperCase() : '';
  let city = null, match = 'unavailable';

  // City-level IP estimates are provided by Cloudflare and can be imprecise.
  // Never use a city name from another country or forward this metadata upstream.
  if (country === 'SI') {
    city = cityFromName(edge.city);
    if (city) match = 'city';
    else {
      city = nearbyCity(edge.latitude, edge.longitude);
      if (city) match = 'nearby';
    }
  }

  return Response.json({
    city: city?.id || null,
    match,
    approximate: true,
  }, {
    headers: {
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
