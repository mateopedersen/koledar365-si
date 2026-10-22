'use strict';
(() => {
  if (document.documentElement.dataset.k365NavigationReady) return;
  document.documentElement.dataset.k365NavigationReady = 'true';
  const closeMenu = (menu, restoreFocus = false) => {
    menu.open = false;
    if (restoreFocus) menu.querySelector('summary')?.focus();
  };
  const fitOpenMenu = () => {
    const panel = document.querySelector('[data-navigation-menu][open] .nav-directory');
    if (!panel) return;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    panel.style.setProperty('--nav-menu-height', `${Math.max(160, viewportHeight - panel.getBoundingClientRect().top - 12)}px`);
  };
  document.addEventListener('toggle', (event) => {
    if (event.target.matches?.('[data-navigation-menu]') && event.target.open) fitOpenMenu();
  }, true);
  window.addEventListener('resize', fitOpenMenu);
  window.visualViewport?.addEventListener('resize', fitOpenMenu);
  document.addEventListener('click', (event) => {
    const menu = document.querySelector('[data-navigation-menu][open]');
    if (!menu) return;
    if (event.target.closest('[data-navigation-close]')) closeMenu(menu, true);
    else if (!menu.contains(event.target) || event.target.closest('.nav-directory a')) closeMenu(menu);
  });
  document.addEventListener('keydown', (event) => {
    const menu = document.querySelector('[data-navigation-menu][open]');
    if (event.key === 'Escape' && menu) {
      event.preventDefault();
      closeMenu(menu, true);
    }
  });
})();
