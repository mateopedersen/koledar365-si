(() => {
  const root = document.querySelector('[data-sun-experience]');
  if (!root) return;

  const form = root.querySelector('[data-sun-form]');
  const citySelect = root.querySelector('[data-sun-city]');
  const dateInput = root.querySelector('[data-sun-date]');
  const slider = root.querySelector('[data-sun-time]');
  const clockOutput = root.querySelector('[data-sun-clock]');
  const heading = root.querySelector('[data-sun-heading]');
  const dayCount = root.querySelector('[data-sun-day-number]');
  const dateCaption = root.querySelector('[data-sun-date-caption]');
  const status = root.querySelector('[data-sun-status]');
  const positionText = root.querySelector('[data-sun-position]');
  const scene = root.querySelector('[data-sun-scene]');
  const sunObject = root.querySelector('[data-sun-object]');
  const path = root.querySelector('[data-sun-path]');
  const stars = root.querySelector('.sun-stars');
  const horizonGlow = root.querySelector('[data-sun-horizon-glow]');
  const scatter = root.querySelector('[data-sun-scatter]');
  const reflection = root.querySelector('[data-sun-reflection]');
  const clouds = [...root.querySelectorAll('[data-sun-cloud]')];
  const warmClouds = [...root.querySelectorAll('[data-cloud-warm]')];
  const playButton = root.querySelector('[data-sun-play]');
  const cityFilter = document.querySelector('[data-sun-city-filter]');
  const cityCount = document.querySelector('[data-sun-city-count]');
  const cityEmpty = document.querySelector('[data-sun-city-empty]');
  const timezone = 'Europe/Ljubljana';
  const radians = Math.PI / 180;
  let activeModel;
  let animation = 0;
  let animationStarted = 0;
  let animationFrom = 0;
  let lastFrame = 0;

  const degreesToRadians = (value) => value * radians;
  const mod = (value, range) => ((value % range) + range) % range;
  const partsInZone = (date, options) => Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: timezone, ...options }).formatToParts(date)
      .filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );
  const asIsoDate = (year, month, day) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dateParts = (iso) => {
    const [year, month, day] = iso.split('-').map(Number);
    return { year, month, day };
  };
  const localToday = () => {
    const parts = partsInZone(new Date(), { year: 'numeric', month: '2-digit', day: '2-digit' });
    return asIsoDate(Number(parts.year), Number(parts.month), Number(parts.day));
  };
  const requestedDateOrToday = (value) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) {
      const { year, month, day } = dateParts(value);
      if (year >= 1901 && year <= 2099 && new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value) return value;
    }
    return localToday();
  };
  const dateLabel = (iso) => {
    const { year, month, day } = dateParts(iso);
    return new Intl.DateTimeFormat('sl-SI', { dateStyle: 'full', timeZone: timezone })
      .format(new Date(Date.UTC(year, month - 1, day, 12)));
  };
  const timeLabel = (year, month, day, minutes) => {
    const instant = new Date(Date.UTC(year, month - 1, day) + minutes * 60_000);
    return new Intl.DateTimeFormat('sl-SI', {
      timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(instant);
  };
  const minuteInZone = (instant) => {
    const parts = partsInZone(instant, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    return Number(parts.hour) * 60 + Number(parts.minute);
  };
  const equation = (year, yday, longitude) => {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const gamma = 2 * Math.PI / (leap ? 366 : 365) * (yday - 1);
    const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
      - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    return { eqtime, noon: 720 - 4 * longitude - eqtime };
  };
  const wrapDegrees = (value) => mod(value + 180, 360) - 180;
  const solarPosition = (instantMs, longitude, latitudeDegrees) => {
    const julianDay = instantMs / 86_400_000 + 2_440_587.5;
    const centuries = (julianDay - 2_451_545) / 36_525;
    const meanLongitude = mod(280.46646 + centuries * (36_000.76983 + 0.0003032 * centuries), 360);
    const meanAnomaly = degreesToRadians(357.52911 + centuries * (35_999.05029 - 0.0001537 * centuries));
    const center = Math.sin(meanAnomaly) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries))
      + Math.sin(2 * meanAnomaly) * (0.019993 - 0.000101 * centuries) + Math.sin(3 * meanAnomaly) * 0.000289;
    const omega = degreesToRadians(125.04 - 1934.136 * centuries);
    const apparentLongitude = degreesToRadians(meanLongitude + center - 0.00569 - 0.00478 * Math.sin(omega));
    const meanObliquity = 23 + (26 + (21.448 - centuries * (46.815 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60;
    const obliquity = degreesToRadians(meanObliquity + 0.00256 * Math.cos(omega));
    const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(apparentLongitude), Math.cos(apparentLongitude)) / radians;
    const declination = Math.asin(Math.sin(obliquity) * Math.sin(apparentLongitude));
    const siderealTime = mod(280.46061837 + 360.98564736629 * (julianDay - 2_451_545)
      + 0.000387933 * centuries ** 2 - centuries ** 3 / 38_710_000, 360);
    const hourAngle = degreesToRadians(wrapDegrees(siderealTime + longitude - rightAscension));
    const latitude = degreesToRadians(latitudeDegrees);
    const elevation = Math.asin(Math.max(-1, Math.min(1,
      Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle)))) / radians;
    const azimuth = mod(Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude)
      - Math.tan(declination) * Math.cos(latitude)) / radians + 180, 360);
    return { hourAngle: wrapDegrees(siderealTime + longitude - rightAscension), elevation, azimuth, declination };
  };
  const transitAt = (utcMidnightMs, noonGuessMinutes, longitude, latitude) => {
    let left = utcMidnightMs + (noonGuessMinutes - 30) * 60_000;
    let right = utcMidnightMs + (noonGuessMinutes + 30) * 60_000;
    for (let iteration = 0; iteration < 48; iteration += 1) {
      const midpoint = left + (right - left) / 2;
      if (solarPosition(midpoint, longitude, latitude).hourAngle < 0) left = midpoint;
      else right = midpoint;
    }
    return left + (right - left) / 2;
  };
  const crossingsAt = (utcMidnightMs, longitude, latitude, altitude) => {
    const events = [];
    let beforeMs = utcMidnightMs;
    let before = solarPosition(beforeMs, longitude, latitude).elevation - altitude;
    for (let minute = 5; minute <= 1440; minute += 5) {
      const afterMs = utcMidnightMs + minute * 60_000;
      const after = solarPosition(afterMs, longitude, latitude).elevation - altitude;
      const rises = before < 0 && after >= 0;
      const sets = before >= 0 && after < 0;
      if (rises || sets) {
        let left = beforeMs;
        let right = afterMs;
        for (let iteration = 0; iteration < 40; iteration += 1) {
          const midpoint = left + (right - left) / 2;
          const value = solarPosition(midpoint, longitude, latitude).elevation - altitude;
          if ((rises && value < 0) || (sets && value >= 0)) left = midpoint;
          else right = midpoint;
        }
        events.push({ kind: rises ? 'rise' : 'set', instant: left + (right - left) / 2 });
      }
      beforeMs = afterMs;
      before = after;
    }
    return events;
  };
  const localMinuteToUtc = (year, month, day, minute) => {
    const target = Date.UTC(year, month - 1, day, Math.floor(minute / 60), minute % 60);
    let guess = target;
    for (let iteration = 0; iteration < 4; iteration += 1) {
      const local = partsInZone(new Date(guess), { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
      const represented = Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), Number(local.hour), Number(local.minute));
      const shift = target - represented;
      if (shift === 0) return guess;
      guess += shift;
    }
    return guess;
  };
  const compute = (dateIso, option) => {
    const { year, month, day } = dateParts(dateIso);
    const yday = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / 86_400_000) + 1;
    const latitudeDegrees = Number(option.dataset.lat);
    const longitude = Number(option.dataset.lon);
    const { noon } = equation(year, yday, longitude);
    const utcMidnightMs = Date.UTC(year, month - 1, day);
    const solarNoonMs = transitAt(utcMidnightMs, noon, longitude, latitudeDegrees);
    const sunEvents = crossingsAt(utcMidnightMs, longitude, latitudeDegrees, -0.833);
    const civilEvents = crossingsAt(utcMidnightMs, longitude, latitudeDegrees, -6);
    const goldHighEvents = crossingsAt(utcMidnightMs, longitude, latitudeDegrees, 6);
    const goldLowEvents = crossingsAt(utcMidnightMs, longitude, latitudeDegrees, -4);
    const find = (events, kind) => events.find((event) => event.kind === kind)?.instant;
    const instants = {
      'civil-dawn': find(civilEvents, 'rise'),
      sunrise: find(sunEvents, 'rise'),
      'golden-morning-start': find(goldLowEvents, 'rise'),
      'golden-morning-end': find(goldHighEvents, 'rise'),
      'solar-noon': solarNoonMs,
      'golden-evening-start': find(goldHighEvents, 'set'),
      sunset: find(sunEvents, 'set'),
      'golden-evening-end': find(goldLowEvents, 'set'),
      'civil-dusk': find(civilEvents, 'set')
    };
    const sunriseMs = instants.sunrise;
    const sunsetMs = instants.sunset;
    if (!sunriseMs || !sunsetMs) throw new Error('Sončnega vzhoda ali zahoda za izbrani datum ni bilo mogoče izračunati.');
    return {
      year, month, day, latitudeDegrees, longitude, latitude: degreesToRadians(latitudeDegrees),
      sunriseMs, sunsetMs, solarNoonMs,
      localNoon: minuteInZone(new Date(solarNoonMs)),
      dayMinutes: Math.round((sunsetMs - sunriseMs) / 60_000),
      labels: Object.fromEntries(Object.entries(instants).map(([key, value]) => [key, timeLabel(year, month, day, (value - utcMidnightMs) / 60_000)]))
    };
  };
  const positionAt = (model, localMinute) => {
    const instant = localMinuteToUtc(model.year, model.month, model.day, localMinute);
    const solar = solarPosition(instant, model.longitude, model.latitudeDegrees);
    const elevation = solar.elevation;
    const azimuth = solar.azimuth;
    const x = 360 - Math.sin(degreesToRadians(azimuth)) * 282;
    const y = 300 - Math.sin(degreesToRadians(elevation)) * 238;
    return { x, y, elevation, azimuth };
  };
  const scenePath = (model) => {
    const points = [];
    for (let index = 0; index <= 80; index += 1) {
      const instant = model.sunriseMs + (model.sunsetMs - model.sunriseMs) * index / 80;
      const solar = solarPosition(instant, model.longitude, model.latitudeDegrees);
      const x = 360 - Math.sin(degreesToRadians(solar.azimuth)) * 282;
      const y = 300 - Math.sin(degreesToRadians(solar.elevation)) * 238;
      const position = { x, y };
      points.push(`${index ? 'L' : 'M'}${position.x.toFixed(1)} ${position.y.toFixed(1)}`);
    }
    return points.join(' ');
  };
  const formatMinute = (minute) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
  const direction = (azimuth) => ['sever', 'severovzhodu', 'vzhodu', 'jugovzhodu', 'jugu', 'jugozahodu', 'zahodu', 'severozahodu'][Math.round(azimuth / 45) % 8];
  const skyPalettes = {
    night: ['#07162b', '#102744', '#1c3650', '#2b3e52'],
    dawnBlue: ['#102440', '#294565', '#52647b', '#967887'],
    dawnWarm: ['#284866', '#735f78', '#cf786f', '#ffc18b'],
    dawnGold: ['#315e8a', '#77829a', '#df9875', '#ffe0a9'],
    day: ['#15548d', '#287eaf', '#77b8cf', '#d3eaf0'],
    duskGold: ['#315d85', '#7d778e', '#e09473', '#ffd7a0'],
    duskWarm: ['#2b4561', '#765c72', '#c76d68', '#f5a174'],
    duskBlue: ['#10233e', '#2b4260', '#515d76', '#8d7485']
  };
  const mixColor = (first, second, amount) => {
    const a = first.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
    const b = second.match(/[\da-f]{2}/gi).map((value) => parseInt(value, 16));
    return `#${a.map((value, index) => Math.round(value + (b[index] - value) * amount).toString(16).padStart(2, '0')).join('')}`;
  };
  const blendPalettes = (first, second, amount) => first.map((color, index) => mixColor(color, second[index], amount));
  const smoothstep = (value) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const setSky = (model, position, minute) => {
    const stops = scene.querySelectorAll('#sun-sky stop');
    const ascending = minute <= model.localNoon;
    const elevation = position.elevation;
    let colors;
    let phase;
    if (elevation < -13) {
      colors = skyPalettes.night; phase = 'night';
    } else if (elevation < -5) {
      colors = blendPalettes(skyPalettes.night, ascending ? skyPalettes.dawnBlue : skyPalettes.duskBlue, smoothstep((elevation + 13) / 8));
      phase = 'blue-hour';
    } else if (elevation < 0) {
      colors = blendPalettes(ascending ? skyPalettes.dawnBlue : skyPalettes.duskBlue, ascending ? skyPalettes.dawnWarm : skyPalettes.duskWarm, smoothstep((elevation + 5) / 5));
      phase = ascending ? 'dawn' : 'dusk';
    } else if (elevation < 8) {
      colors = blendPalettes(ascending ? skyPalettes.dawnWarm : skyPalettes.duskWarm, ascending ? skyPalettes.dawnGold : skyPalettes.duskGold, smoothstep(elevation / 8));
      phase = ascending ? 'golden-morning' : 'golden-evening';
    } else if (elevation < 18) {
      colors = blendPalettes(ascending ? skyPalettes.dawnGold : skyPalettes.duskGold, skyPalettes.day, smoothstep((elevation - 8) / 10));
      phase = 'day';
    } else {
      colors = skyPalettes.day; phase = 'day';
    }
    stops.forEach((stop, index) => stop.setAttribute('stop-color', colors[index]));
    scene.dataset.sunPhase = phase;
    root.style.setProperty('--sun-land-light', String(Math.max(0, Math.min(1, (elevation + 7) / 25))));
    if (stars) stars.style.opacity = elevation < -6 ? String(Math.min(.96, .45 + (-elevation - 6) / 28)) : '.02';
    const nearHorizon = Math.exp(-Math.abs(elevation) / 8.5);
    if (horizonGlow) {
      horizonGlow.setAttribute('cx', position.x.toFixed(1));
      horizonGlow.style.opacity = elevation < -13 ? '.015' : String(.04 + nearHorizon * .48);
    }
    if (scatter) {
      scatter.setAttribute('cx', position.x.toFixed(1));
      scatter.setAttribute('cy', String(Math.max(240, Math.min(302, position.y + 12))));
      scatter.setAttribute('rx', String(54 + nearHorizon * 116));
      scatter.setAttribute('ry', String(30 + nearHorizon * 42));
      scatter.style.opacity = elevation < -13 ? '.008' : String(.025 + nearHorizon * .46);
    }
    clouds.forEach((cloud, index) => {
      const phase = minute / 1440 * Math.PI * 2 + index * 1.8;
      const phaseShift = minute / 1440 * (index === 0 ? 28 : -20) + Math.sin(phase) * 2.2;
      const lift = Math.cos(phase) * 1.1;
      cloud.setAttribute('transform', `translate(${phaseShift.toFixed(1)} ${lift.toFixed(1)})`);
      cloud.style.opacity = elevation < -8 ? '.23' : elevation < 0 ? '.48' : '.76';
    });
    const cloudWarmth = Math.max(0, 1 - Math.abs(elevation - 1) / 8);
    warmClouds.forEach((cloud) => { cloud.style.opacity = String(cloudWarmth * .82); });
  };
  const paintSun = (minute) => {
    if (!activeModel) return;
    const position = positionAt(activeModel, minute);
    const x = Math.max(30, Math.min(690, position.x));
    const y = Math.max(37, Math.min(374, position.y));
    const visibility = Math.max(0, Math.min(1, (position.elevation + 2.1) / 1.4));
    sunObject.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    sunObject.style.opacity = String(visibility);
    const atmosphericReddening = Math.max(0, Math.min(.5, (11 - position.elevation) / 18));
    sunObject.style.filter = `sepia(${atmosphericReddening}) saturate(${1 + atmosphericReddening * .55})`;
    setSky(activeModel, position, minute);
    if (reflection) {
      reflection.setAttribute('d', `M${x.toFixed(1)} 332 Q${(x - 9).toFixed(1)} 344 ${x.toFixed(1)} 357`);
      reflection.style.opacity = position.elevation > -0.83 ? String(Math.max(.06, Math.min(.42, (11 - position.elevation) / 28))) : '0';
    }
    clockOutput.textContent = formatMinute(minute);
    slider.setAttribute('aria-valuetext', `${formatMinute(minute)} po času v Sloveniji`);
    if (position.elevation < -0.833) {
      positionText.textContent = position.elevation < -6
        ? 'Sonce je pod obzorjem; simulacija prikazuje nočno nebo.'
        : `Sonce je pod obzorjem, ${Math.abs(position.elevation).toFixed(1)}° pod obzorjem.`;
    } else {
      positionText.textContent = `Sonce je ${position.elevation.toFixed(1)}° nad obzorjem, proti ${direction(position.azimuth)}; azimut ${Math.round(position.azimuth)}°.`;
    }
  };
  const updateUrl = (replace = false) => {
    const city = citySelect.value;
    const date = dateInput.value;
    const next = new URL(`/soncni-vzhod-in-zahod/${encodeURIComponent(city)}/?date=${encodeURIComponent(date)}`, window.location.origin);
    if (replace) history.replaceState({ sun: true }, '', next);
    else history.pushState({ sun: true }, '', next);
  };
  const render = ({ syncUrl = false, replaceUrl = false } = {}) => {
    const option = citySelect.selectedOptions[0];
    if (!option || !dateInput.value) return;
    const dateIso = dateInput.value;
    const { year } = dateParts(dateIso);
    if (year < 1901 || year > 2099) {
      if (status) status.textContent = 'Izberite datum med letoma 1901 in 2099.';
      return;
    }
    activeModel = compute(dateIso, option);
    const city = option.textContent.trim();
    const coordinateSource = root.querySelector('[data-sun-coordinate-source]');
    if (coordinateSource) {
      coordinateSource.href = option.dataset.coordinateSource;
      coordinateSource.textContent = `Koordinate: ${city}`;
    }
    const label = dateLabel(dateIso);
    if (heading) heading.textContent = `${city} · ${label}`;
    if (dateCaption) dateCaption.textContent = `${label} · ${city}`;
    const cityName = root.querySelector('[data-sun-city-name]');
    if (cityName) cityName.textContent = city;
    root.querySelectorAll('[data-sun-value]').forEach((node) => {
      const key = node.dataset.sunValue;
      const map = { sunrise: 'sunrise', sunset: 'sunset', 'solar-noon': 'solar-noon', 'civil-dawn': 'civil-dawn', 'civil-dusk': 'civil-dusk', 'golden-morning-start': 'golden-morning-start', 'golden-morning-end': 'golden-morning-end', 'golden-evening-start': 'golden-evening-start', 'golden-evening-end': 'golden-evening-end' };
      if (activeModel.labels[map[key]]) node.textContent = activeModel.labels[map[key]];
    });
    if (dayCount) dayCount.innerHTML = `${Math.floor(activeModel.dayMinutes / 60)}<small>h</small> ${activeModel.dayMinutes % 60}<small>min svetlobe</small>`;
    scene.querySelector('#sun-scene-title').textContent = `Pot Sonca za ${city}`;
    scene.querySelector('#sun-scene-description').textContent = `Izračunana pot Sonca za ${label} v ${city}. Drsnik prikaže položaj Sonca v izbrani slovenski uri.`;
    path.setAttribute('d', scenePath(activeModel));
    if (dateIso === localToday()) slider.value = String(minuteInZone(new Date()));
    else slider.value = String(Math.round(activeModel.localNoon));
    paintSun(Number(slider.value));
    if (status) status.textContent = `Izračun posodobljen: ${city}, ${label}.`;
    if (syncUrl) updateUrl(replaceUrl);
  };
  const stopAnimation = () => {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    playButton.dataset.playing = 'false';
    playButton.setAttribute('aria-pressed', 'false');
    playButton.innerHTML = '<span aria-hidden="true">▶</span> Predvajaj dnevno pot';
  };
  const animate = (now) => {
    const progress = Math.min(1, (now - animationStarted) / 22_000);
    const minute = Math.floor(animationFrom + (1439 - animationFrom) * progress);
    if (now - lastFrame > 70 || progress === 1) {
      lastFrame = now;
      slider.value = String(minute);
      paintSun(minute);
    }
    if (progress < 1) animation = requestAnimationFrame(animate);
    else stopAnimation();
  };
  const startAnimation = () => {
    if (animation) { stopAnimation(); return; }
    animationFrom = Number(slider.value);
    if (animationFrom >= 1430) animationFrom = 0;
    animationStarted = performance.now();
    lastFrame = 0;
    playButton.dataset.playing = 'true';
    playButton.setAttribute('aria-pressed', 'true');
    playButton.innerHTML = '<span aria-hidden="true">Ⅱ</span> Ustavi simulacijo';
    animation = requestAnimationFrame(animate);
  };

  const url = new URL(window.location.href);
  const routeCity = window.location.pathname.match(/^\/soncni-vzhod-in-zahod\/([a-z0-9-]+)\/$/)?.[1];
  const queryCity = url.searchParams.get('city');
  const initialCity = queryCity || routeCity || root.dataset.selectedCity;
  if ([...citySelect.options].some((option) => option.value === initialCity)) citySelect.value = initialCity;
  const initialDate = url.searchParams.get('date');
  dateInput.value = requestedDateOrToday(initialDate);
  render();
  if (initialDate && initialDate !== dateInput.value && status) status.textContent = 'Datum v povezavi ni veljaven. Prikazan je današnji datum.';

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    stopAnimation();
    render({ syncUrl: true });
  });
  citySelect.addEventListener('change', () => { stopAnimation(); render({ syncUrl: true }); });
  dateInput.addEventListener('change', () => { stopAnimation(); render({ syncUrl: true }); });
  slider.addEventListener('input', () => { stopAnimation(); paintSun(Number(slider.value)); });
  playButton.addEventListener('click', startAnimation);
  root.querySelector('[data-sun-prev]')?.addEventListener('click', () => moveDate(-1));
  root.querySelector('[data-sun-next]')?.addEventListener('click', () => moveDate(1));
  root.querySelector('[data-sun-live]')?.addEventListener('click', () => {
    dateInput.value = localToday();
    stopAnimation();
    render({ syncUrl: true });
  });
  function moveDate(days) {
    const { year, month, day } = dateParts(dateInput.value);
    const shifted = new Date(Date.UTC(year, month - 1, day + days, 12));
    const value = asIsoDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
    if (value >= dateInput.min && value <= dateInput.max) {
      dateInput.value = value;
      stopAnimation();
      render({ syncUrl: true });
    }
  }

  root.querySelector('[data-sun-locate]')?.addEventListener('click', () => {
    if (!navigator.geolocation) { status.textContent = 'Ta brskalnik ne podpira lokacije. Mesto izberite na seznamu.'; return; }
    status.textContent = 'Določamo najbližje mesto. Brskalnik vas bo vprašal za dovoljenje za lokacijo.';
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      let nearest = null;
      let nearestDistance = Infinity;
      for (const option of citySelect.options) {
        const radiansLat = degreesToRadians(Number(option.dataset.lat));
        const userLat = degreesToRadians(coords.latitude);
        const dLat = userLat - radiansLat;
        const dLon = degreesToRadians(coords.longitude - Number(option.dataset.lon));
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(userLat) * Math.cos(radiansLat) * Math.sin(dLon / 2) ** 2;
        const distance = 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
        if (distance < nearestDistance) { nearestDistance = distance; nearest = option; }
      }
      if (nearest) {
        citySelect.value = nearest.value;
        stopAnimation();
        render({ syncUrl: true });
        status.textContent = `Najbližje mesto s seznama je ${nearest.textContent.trim()} (${Math.round(nearestDistance)} km). Vaših koordinat ne pošiljamo.`;
      }
    }, (error) => {
      const message = error.code === 1 ? 'Dovoljenje za lokacijo ni bilo odobreno. Mesto lahko izberete ročno.' : 'Lokacije ni bilo mogoče določiti. Mesto lahko izberete ročno.';
      status.textContent = message;
    }, { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 });
  });
  root.querySelector('[data-sun-share]')?.addEventListener('click', async (event) => {
    updateUrl(true);
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = 'Povezava je kopirana';
      status.textContent = 'Povezava do mesta, datuma in izračuna je kopirana.';
    } catch {
      button.textContent = 'Povezavo kopirajte iz naslovne vrstice';
      status.textContent = 'Brskalnik ni dovolil kopiranja. Povezavo lahko kopirate iz naslovne vrstice.';
    }
    setTimeout(() => { button.innerHTML = '<span aria-hidden="true">↗</span> Kopiraj povezavo do izračuna'; }, 2400);
  });
  window.addEventListener('popstate', () => {
    const current = new URL(window.location.href);
    const city = current.searchParams.get('city') || current.pathname.match(/^\/soncni-vzhod-in-zahod\/([a-z0-9-]+)\/$/)?.[1];
    if (city && [...citySelect.options].some((option) => option.value === city)) citySelect.value = city;
    const date = current.searchParams.get('date');
    dateInput.value = requestedDateOrToday(date);
    render();
  });

  if (cityFilter) {
    const normalize = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('sl');
    const cityCards = [...document.querySelectorAll('.sun-city-link')];
    cityFilter.addEventListener('input', () => {
      const query = normalize(cityFilter.value.trim());
      let visible = 0;
      cityCards.forEach((card) => {
        const match = normalize(card.dataset.cityName).includes(query);
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (cityCount) cityCount.textContent = `${visible} ${visible === 1 ? 'mesto' : 'mest'}`;
      if (cityEmpty) cityEmpty.hidden = visible !== 0;
    });
  }
})();
