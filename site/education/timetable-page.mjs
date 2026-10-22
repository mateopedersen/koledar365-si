import { validateLesson } from './timetable.mjs';

const root = document.querySelector('[data-timetable-page]');
if (root) {
  const tabs = [...root.querySelectorAll('[data-timetable-mode]')];
  const panels = [...root.querySelectorAll('[data-timetable-panel]')];
  function show(mode, remember = false) {
    const selected = mode === 'period' ? 'period' : 'weekly';
    for (const tab of tabs) {
      const active = tab.dataset.timetableMode === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.timetablePanel !== selected;
    if (remember) {
      const url = new URL(location.href);
      if (selected === 'period') url.searchParams.set('nacin', 'obdobje');
      else url.searchParams.delete('nacin');
      history.replaceState(null, '', url);
    }
  }
  function followFragment() {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const panel = target?.closest('[data-timetable-panel]');
    if (panel) show(panel.dataset.timetablePanel, true);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => show(tab.dataset.timetableMode, true));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[next].focus(); show(tabs[next].dataset.timetableMode, true);
    });
  });
  root.querySelector('[data-copy-weekly-lessons]').addEventListener('click', () => {
    const status = root.querySelector('[data-timetable-mode-status]');
    try {
      const saved = JSON.parse(localStorage.getItem('k365.student.timetable.v1') || 'null');
      if (!Array.isArray(saved?.lessons) || !saved.lessons.length) {
        status.textContent = 'V tedenskem planerju še ni predmetov. Najprej dodajte predmete ali jih vnesite v spodnji obrazec.';
        return;
      }
      const lessons = saved.lessons.map(lesson => validateLesson({
        id: `weekly-${lesson.id}`, subject: lesson.subject, day: Number(lesson.day),
        startTime: lesson.start, endTime: lesson.end, room: lesson.room || '',
        teacher: lesson.teacher || '', repeat: 'weekly', date: '',
      }));
      root.querySelector('[data-school-timetable]').dispatchEvent(new CustomEvent('k365:copy-weekly-lessons', {
        detail: { lessons, report: message => { status.textContent = message; } },
      }));
    } catch { status.textContent = 'Kopije tedenskega planerja ni mogoče prebrati. Izvirni podatki so ohranjeni; preverite varnostno kopijo.'; }
  });
  show(new URL(location.href).searchParams.get('nacin') === 'obdobje' ? 'period' : 'weekly');
  followFragment();
  window.addEventListener('hashchange', followFragment);
}
