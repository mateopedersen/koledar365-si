(() => {
  const root = document.querySelector('[data-site-share]');
  if (!root) return;
  const details = root.querySelector('details');
  const trigger = root.querySelector('summary');
  const input = root.querySelector('[data-share-input]');
  const status = root.querySelector('[data-share-status]');
  const native = root.querySelector('[data-share-native]');
  const copy = root.querySelector('[data-share-copy]');
  const url = root.dataset.shareUrl;
  const title = root.dataset.shareTitle;

  if (typeof navigator.share === 'function') {
    native.hidden = false;
    native.addEventListener('click', async () => {
      try {
        await navigator.share({ title, url });
        status.textContent = 'Meni za deljenje je odprt.';
      } catch (error) {
        if (error?.name !== 'AbortError') status.textContent = 'Deljenje ni uspelo. Izberite omrežje ali kopirajte povezavo.';
      }
    });
  }

  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(url);
      status.textContent = 'Povezava je kopirana.';
    } catch {
      input.focus();
      input.select();
      status.textContent = 'Povezava je označena. Kopirajte jo ročno.';
    }
  });

  document.addEventListener('pointerdown', event => {
    if (details.open && !root.contains(event.target)) details.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && details.open) {
      details.open = false;
      trigger.focus();
    }
  });
})();
