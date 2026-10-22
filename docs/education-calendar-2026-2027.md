# Education calendars and school timetable

Verified dataset: **21 October 2026**, school/academic year **2026/2027**. All new factual sources are primary publications in Slovenian. The file contains 239 structured events: 65 school, 105 matura, 24 NPZ and 45 university/faculty periods.

## Live path inventory after deployment

New pages:

- `/solski-koledar/`
- `/matura/2027/`
- `/matura/2027/splosna/`
- `/matura/2027/poklicna/`
- `/npz/`
- `/npz/3-razred/`
- `/npz/6-razred/`
- `/npz/9-razred/`
- `/studijski-koledar/`

Rebuilt existing tool: `/solski-urnik/`.

Existing holiday template copy/links also changed on `/solske-pocitnice/`, `/solske-pocitnice/2026-2027/`, `/solske-pocitnice/jesenske/`, `/solske-pocitnice/novoletne/`, `/solske-pocitnice/poletne/`, `/solske-pocitnice/prvomajske/` and `/solske-pocitnice/zimske/`. Future held years retain their verification notice and are not promoted to published status by this component.

## Integration contract

`EducationCalendar.paths` returns the nine new paths. `EducationCalendar.page(path)` supplies a unique title, description, H1, intro and kind. Instantiate with `EducationCalendar.new(path: path)` and render `pages/education_calendar`. The service exposes `questions` for its visible FAQ and `sources` for its actual scoped sources. `EducationCalendar::TIMETABLE` contains the existing timetable's metadata.

Render `pages/school_timetable` for `/solski-urnik/` instead of the generic planner. Each partial renders its own H1; do not add a generic page heading or duplicate editorial body.

Both templates load `/education/experience.css`. Calendar pages load `/education/experience.mjs`; the timetable loads `/education/timetable.mjs` (which imports the shared pure helpers). Preserve ES modules in static export. Include `/education/data.json` and the modules/styles in source fingerprints and public asset copying.

## Functional scope

- School calendar: September–August, primary/secondary, grade, final/nonfinal secondary year, winter region and category filters. Primary school view includes the selected grade's NPZ events. The September 2027 tail of the secondary autumn exam period is retained in the list and identified on annual print output.
- Matura: fixed general/vocational detail pages plus a switching hub; spring/autumn session; searchable subject checkboxes; shared application/results deadlines remain when a subject is selected. Oral windows remain windows. Autumn elective/foreign-language days explicitly require the school schedule; mathematics-only selection does not receive those unrelated dates.
- NPZ: correct grade-specific tests, results, inspection/inquiry windows and certificate dates. No universal ninth-grade third subject is invented.
- University calendar: October–September. Verified frameworks for UL, UM, UP, UNG and Nova univerza; distinct FIŠ and FEI calendars for UNM. These do not claim to cover all university members. Existing holiday-page university data stays available; the new hub does not copy an English EMUNI calendar into the Slovenian-source dataset.
- All calendar pages retain server-rendered dates and source links without JavaScript. Client filters, upcoming dates (Europe/Ljubljana), annual day inspection, event selection, local ICS and print/PDF work without a server API.
- Calendar ICS uses stable event IDs, UTF-8 line folding, escaped text and an exclusive end date one day after the displayed inclusive end.
- Timetable: subject, weekday, start/end time, room, teacher, weekly/one-date repeat, term settings, verified holiday exclusion, per-week conflict display, add/edit/remove/undo, JSON backup/import and date-specific ICS. The same local 08:00 remains 08:00 across DST; ambiguous/nonexistent transition times are rejected explicitly. Print produces the selected week.
- Import previews the backup and requires the user to replace their current local timetable; a current-backup download is provided in that dialog.

## Personal data and storage

The timetable saves under `k365.school-timetable.v1` in localStorage. Teacher names, rooms and classes stay in this browser and user-triggered exports. No network upload is used.

Legacy keys `k365.entries./solski-urnik/` and `k365.options./solski-urnik/` are read only to offer a previous-plan backup. They are not removed or overwritten. A valid legacy JSON backup with explicit start/end times can be imported as exact one-date lessons; missing times are never invented. The old generic `Oseba` field is retained as `legacyPerson` with a neutral label, never silently relabelled as a teacher.

Education calendar filters use a shareable URL query. Selected event IDs remain in memory; these pages do not use localStorage.

## Data boundaries and updates

Do not infer unannounced future school schedules. School holiday ranges differ between primary and secondary calendars. Secondary assessment period one is restricted to schools with two periods. Individual oral exams, faculty exams and school-specific NPZ subjects require local schedules.

School year begins September; academic year begins October. Public-holiday rules use GOV.SI. Easter Sunday and Pentecost 2027 are explicitly marked as calculated movable holidays; they are not represented as exact dates quoted from the ministry's school table.

To update: re-read the Slovenian source for the relevant year, update factual events and `reviewedAt`/source `checkedAt`, retain stable IDs for unchanged events, rerun targeted tests, and check print/export output. Do not change the year labels alone.

## Sources

- **Ministrstvo za vzgojo in izobraževanje · osnovne šole**: https://www.gov.si/teme/solski-koledar-za-osnovne-sole/ (Slovenian; checked 2026-10-21)
- **Ministrstvo za vzgojo in izobraževanje · srednje šole**: https://www.gov.si/teme/solski-koledar-za-srednje-sole/ (Slovenian; checked 2026-10-21)
- **Državni izpitni center · splošna matura 2027**: https://www.ric.si/splosna-matura/koledar-splosne-mature/ (Slovenian; checked 2026-10-21)
- **Državni izpitni center · poklicna matura 2027**: https://www.ric.si/poklicna-matura/koledar-poklicne-mature/ (Slovenian; checked 2026-10-21)
- **Državni izpitni center · NPZ 2026/2027**: https://www.ric.si/nacionalno-preverjanje-znanja/koledar-npz/ (Slovenian; checked 2026-10-21)
- **Univerza v Ljubljani · študijski koledar 2026/2027**: https://www.uni-lj.si/assets/Sluzba-za-1-in-2-stopnjo/Studijski-koledar/2026-2027/Studijski_koledar-2026_2027-besedilo.pdf (Slovenian; checked 2026-10-21)
- **Univerza v Mariboru · študijski koledar 2026/2027**: https://moja.um.si/student/Strani/studijski-koledar.aspx (Slovenian; checked 2026-10-21)
- **Univerza na Primorskem · študijski koledar 2026/2027**: https://www.upr.si/si/studij--vpis/studijski-koledar/ (Slovenian; checked 2026-10-21)
- **Univerza v Novi Gorici · študijski koledar 2026/2027**: https://ung.si/sl/studij/akademski-koledar/ (Slovenian; checked 2026-10-21)
- **Nova univerza · študijski koledar 2026/2027**: https://www.nova-uni.si/studijski-koledar-nove-univerze-za-studijsko-leto-2026-2027-2/ (Slovenian; checked 2026-10-21)
- **FIŠ · Fakulteta za informacijske študije · študijski koledar 2026/2027**: https://www.fis.unm.si/urnik-in-studijski-koledar/ (Slovenian; checked 2026-10-21)
- **FEI · Fakulteta za ekonomijo in informatiko · študijski koledar 2026/2027**: https://fei.uni-nm.si/uploads/_custom/01_unmfei/studijski_koledar/Studijski_koledar_2026-2027.pdf (Slovenian; checked 2026-10-21)
- **GOV.SI · državni prazniki in dela prosti dnevi**: https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/ (Slovenian; checked 2026-10-21)

## Validation performed

- `node script/test_education.mjs`: 12 tests, all passing. Covers dates/source provenance, region/grade/type separation, matura deadlines, NPZ result differences, subject filters, Ljubljana day boundaries, UTF-8/all-day ICS, academic-year grids, regional break exclusion, DST local times, overlap and backup validation.
- Rails targeted suite: `test/models/education_calendar_test.rb` + `test/integration/education_test.rb`: 7 tests, 287 assertions, all passing. Every new route has its own H1/metadata, server-rendered dates, sources and module assets. Timetable fields and the existing holiday hub's new links are checked.
- Local Chromium: all 10 routes return 200 and one H1; real ICS/JSON downloads inspected; type/subject/grade/region filters, day selection, 12-month view, localStorage persistence, overlap and undo exercised. No page JavaScript errors. No document overflow at 1440, 390 or 320 px. Every NPZ variant, study calendar and both matura detail pages were also individually checked at 320 px. Valid JSON restore was exercised in the browser; invalid JSON left the current plan unchanged. Subject search accepts unaccented input such as `spanscina` for `Španščina`.
- Annual school print and timetable weekly print each produce one A4 page. The school print identifies school level, region and grade. Oral windows and date-specific ICS identities were verified independently in tests.
- `test/browser/education.spec.mjs` adds five reusable Playwright cases to the existing four-project CI matrix. Local Chromium and Android Chromium runs: 10/10 passing. These exercise actual downloads, region/grade and matura scope, one-event ICS selection, print invocation, NPZ/university scope, 320 px layout, timetable CRUD/reload/DST, and confirmed/cancelled/invalid JSON restore. WebKit projects remain for the full browser matrix; the local education run had only Chromium binaries installed.
- Read-only anchor check of the 10 education/tool pages and `/viri-in-metodologija/`: 37 local fragment references across 11 source pages, zero missing targets. Cross-page school and gardening source-section anchors were included.

Local preview used a dedicated SQLite copy and port 3662. Generated browser proof images/PDFs live under `/tmp/koledar365-education-*` and `/tmp/koledar365-timetable-*`. Four existing versioned shared SVG assets return 404 in this development preview; they are unrelated to education assets and must be generated by the shared asset/export pipeline. Production was not deployed by this component.
