'use strict';
(() => {
  if (document.documentElement.dataset.k365NavigationReady) return;
  document.documentElement.dataset.k365NavigationReady = 'true';

  const menu = document.querySelector('[data-navigation-menu]');
  if (!menu) return;

  const directory = menu.querySelector('#site-tools-menu');
  const navigation = menu.closest('.site-navigation');
  const trigger = menu.querySelector('summary');
  const query = directory.querySelector('[data-navigation-query]');
  const categories = directory.querySelector('[data-navigation-categories]');
  const categorySelect = categories.querySelector('[data-navigation-category-select]');
  const categoryButtons = [...categories.querySelectorAll('[data-navigation-category]')];
  const results = directory.querySelector('.nav-directory__results');
  const count = directory.querySelector('[data-navigation-count]');
  const empty = directory.querySelector('[data-navigation-empty]');
  const close = directory.querySelector('[data-navigation-close]');
  const fold = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  const groups = [...results.querySelectorAll('[data-navigation-group]')].map(section => ({
    section,
    cards: [...section.querySelectorAll('[data-navigation-tool]')].map(link => ({
      link,
      text: fold([section.getAttribute('aria-label'), link.querySelector('strong').textContent,
        link.querySelector('small').textContent, new URL(link.href).pathname, link.dataset.toolKeywords].join(' ')),
    })),
  }));

  let selected = 'all';
  const updateResults = () => {
    const terms = fold(query.value).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const { section, cards } of groups) {
      const matchesCategory = selected === 'all' || section.dataset.navigationGroup === selected;
      let visibleCards = 0;
      for (const { link, text } of cards) {
        const matches = matchesCategory && terms.every(term => text.includes(term));
        link.hidden = !matches;
        if (matches) visibleCards += 1;
      }
      section.hidden = visibleCards === 0;
      shown += visibleCards;
    }

    for (const button of categoryButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.navigationCategory === selected));
    }
    categorySelect.value = selected;
    count.textContent = `Prikazano: ${shown}`;
    empty.hidden = shown > 0;
    results.scrollTop = 0;
    directory.scrollTop = 0;
  };

  const selectCategory = key => {
    selected = key;
    query.value = '';
    updateResults();
  };

  close.hidden = false;
  categories.hidden = false;
  query.closest('[data-navigation-filter]').hidden = false;
  query.addEventListener('input', () => {
    selected = 'all';
    updateResults();
  });
  categories.addEventListener('click', event => {
    const button = event.target.closest('[data-navigation-category]');
    if (button) selectCategory(button.dataset.navigationCategory);
  });
  categorySelect.addEventListener('change', () => selectCategory(categorySelect.value));

  const fitOpenMenu = () => {
    if (!menu.open) return;
    const viewport = window.visualViewport;
    const top = viewport?.offsetTop || 0;
    const height = viewport?.height || window.innerHeight;
    const anchor = navigation.getBoundingClientRect().bottom;
    const available = top + height - anchor - 10;
    const floating = available < 270 || anchor < top;
    const panelHeight = floating ? height - 16 : available;
    directory.classList.toggle('nav-directory--floating', floating);
    directory.classList.toggle('nav-directory--compact', panelHeight < 355);
    directory.style.setProperty('--nav-menu-top', `${top + 8}px`);
    directory.style.setProperty('--nav-menu-height', `${Math.max(0, panelHeight)}px`);
  };

  const closeMenu = (restoreFocus = false) => {
    menu.open = false;
    if (restoreFocus) trigger.focus();
  };

  menu.addEventListener('toggle', fitOpenMenu);
  window.addEventListener('resize', fitOpenMenu);
  window.addEventListener('scroll', fitOpenMenu, { passive: true });
  window.visualViewport?.addEventListener('resize', fitOpenMenu);
  window.visualViewport?.addEventListener('scroll', fitOpenMenu);
  document.addEventListener('click', event => {
    if (!menu.open) return;
    if (event.target.closest('[data-navigation-close]')) closeMenu(true);
    else if (!menu.contains(event.target) || event.target.closest('.nav-directory a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.open) {
      event.preventDefault();
      closeMenu(true);
    }
  });
})();
