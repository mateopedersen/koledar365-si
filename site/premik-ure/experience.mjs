// Dates are rendered by Ruby from the verified Slovenian schedule. Compare the
// UTC transition instant so a visitor's device timezone cannot move the cutoff.
export function nextClockChange(changes, now = Date.now()) {
  return changes.find(change => Date.parse(change.instant) > now) || null;
}

export function refreshClockChange(root, changes, now = Date.now()) {
  const upcoming = nextClockChange(changes, now);
  root.querySelector('[data-clock-change-upcoming]').hidden = !upcoming;
  root.querySelector('[data-clock-change-empty]').hidden = Boolean(upcoming);
  if (!upcoming) return;
  const date = root.querySelector('[data-next-date]');
  date.dateTime = upcoming.date;
  date.textContent = upcoming.date_label;
  root.querySelector('[data-next-hours]').textContent = `${upcoming.before} → ${upcoming.after}`;
  root.querySelector('[data-next-direction]').textContent = `Eno uro ${upcoming.direction}`;
  root.querySelector('[data-next-sentence]').textContent = upcoming.sentence;
  root.querySelector('[data-next-year]').href = `#datum-${upcoming.date.slice(0,4)}`;
}

if (typeof document !== 'undefined') {
  const root = document.querySelector('[data-clock-change]');
  const data = document.getElementById('clock-change-data');
  if (root && data) {
    const changes = JSON.parse(data.textContent);
    let timer;
    const refresh = () => {
      clearTimeout(timer);
      const now = Date.now();
      refreshClockChange(root, changes, now);
      const next = nextClockChange(changes, now);
      if (next) timer = setTimeout(refresh, Math.min(60000, Math.max(50, Date.parse(next.instant) - now)));
    };
    refresh();
    window.addEventListener('pageshow', refresh);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }
}
