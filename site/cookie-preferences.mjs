const noticeKey = 'koledar365:cookie-preferences:v1';
const cityConsentKey = 'k365.consent';
const lifetime = 180 * 86400000;

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function removeRememberedCity() {
  try {
    localStorage.removeItem('k365.city');
  } catch {
    // The calendar and forecast still work when browser storage is unavailable.
  }
}

function cityChoice() {
  const record = read(cityConsentKey);
  return record?.version === 2 && Number.isFinite(record.expiresAt) && record.expiresAt > Date.now() ? record : null;
}

function chooseCity(allowed) {
  const saved = save(cityConsentKey, {
    version: 2,
    preferences: allowed,
    analytics: false,
    advertising: false,
    expiresAt: Date.now() + lifetime,
  });
  if (!allowed) removeRememberedCity();
  document.dispatchEvent(new CustomEvent('k365:consent', { detail: { preferences: allowed && saved } }));
  return saved;
}

window.K365Preferences = { choice: cityChoice, choose: chooseCity };
if (cityChoice()?.preferences !== true) removeRememberedCity();

const notice = document.getElementById('storage-notice');
const dialog = document.querySelector('.cookie-preferences-dialog');
const city = document.getElementById('cookie-preferences');
const status = dialog.querySelector('.cookie-preferences-status');
let closedOnPage = false;
let opener;

function noticeAcknowledged() {
  const record = read(noticeKey);
  return record?.version === 1 && Number.isFinite(record.savedAt) && record.expiresAt > Date.now()
    && record.expiresAt <= record.savedAt + lifetime;
}

function updateClearance() {
  const floating = !notice.hidden && getComputedStyle(notice).position === 'fixed';
  const height = floating ? Math.ceil(notice.getBoundingClientRect().height) : 0;
  const rootStyle = document.documentElement.style;
  const clearance = `${height}px`;
  if (rootStyle.getPropertyValue('--cookie-space') === clearance) return;
  rootStyle.setProperty('--cookie-space', clearance);
  document.dispatchEvent(new Event('k365:storage-notice-layout'));
}

function updateNotice() {
  notice.hidden = closedOnPage || noticeAcknowledged() || Boolean(cityChoice());
  updateClearance();
}

function dismissNotice() {
  closedOnPage = true;
  updateNotice();
}

notice.querySelector('[data-storage-dismiss]').addEventListener('click', () => {
  const savedAt = Date.now();
  save(noticeKey, { version: 1, savedAt, expiresAt: savedAt + lifetime });
  dismissNotice();
});
notice.querySelector('[data-storage-close]').addEventListener('click', dismissNotice);
notice.addEventListener('keydown', event => {
  if (event.key === 'Escape') dismissNotice();
});

dialog.querySelector('[data-cookie-cancel]').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
dialog.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  if (chooseCity(city.checked)) {
    updateNotice();
    dialog.close();
  } else {
    status.textContent = 'Izbire ni mogoče shraniti v tem brskalniku.';
    status.hidden = false;
  }
});

document.addEventListener('click', event => {
  const trigger = event.target.closest?.('[data-cookie-preferences], [data-cookie-open]');
  if (!trigger || dialog.open) return;
  event.preventDefault();
  opener = trigger;
  city.checked = cityChoice()?.preferences === true;
  status.hidden = true;
  dialog.showModal();
});

window.addEventListener('storage', event => {
  if ([noticeKey, cityConsentKey, null].includes(event.key)) updateNotice();
});
new ResizeObserver(updateClearance).observe(notice);
window.addEventListener('resize', updateClearance);
updateNotice();
