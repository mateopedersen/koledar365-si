# Astronomy data and diagrams

These additions support `/polna-luna/`, `/mlaj/`, `/lunine-mene/`,
`/soncni-mrk/`, `/lunin-mrk/` and `/perzeidi/` for 2026–2030.
They do not change the existing 2027–2030 printable lunar atlas, the
69-city solar calculator, or the daylight-saving-time infographic.

## Reproduce

From the repository root:

```sh
node script/astronomy/generate.mjs
python script/astronomy/generate_visuals.py
bundle exec rails runner script/astronomy/export_ics.rb
node test/javascript/astronomy_test.cjs
bundle exec rails test test/models/astronomy_schedule_test.rb test/integration/astronomy_pages_test.rb
```

Use an explicit healthy `DATABASE_URL` for Rails commands. The data generator
is network-free and uses the vendored MIT Astronomy Engine. The diagram
generator requires Pillow and Inkscape and uses local DejaVu Sans. The site
itself inherits its existing typography. No AI-generated scientific graphics
or external image assets are used.

## Sources and verification

The generated JSON records the numerical engine hash, coordinates, horizon
model, source URLs and 17 independent reference checks. Solar first contacts
and geometric maxima for Ljubljana, Maribor, Koper and Murska Sobota on
12 August 2026 are compared with the Slovenian Astronomical Society Orion
publication by Igor Žiberna. The error is under a minute. Maribor sunset and
the 28 August 2026 lunar maximum are also checked. Seven lunar contacts on
7 September 2025 are compared with Cosmolab's Slovenian timetable, within
90 seconds. These are calibration examples; they are not a claim that every
future local event has an independent published confirmation.

Moon phases come directly from `data/source/usno-moon-2026.json` through
2030. The USNO minute-resolution UT1 values are represented as approximate
UTC before conversion to `Europe/Ljubljana`; there is no invented DUT1
correction. The 2026 full-moon list has 13 entries. On 21 October 2026 the
next full moon is 26 October at 04:12 approximate UTC, 05:12 CET.

## Important distinctions

- A global solar maximum is different from a local maximum. A geometric local
  maximum may be below the horizon. The August 2026 Slovenian event and the
  January 2028 event are deliberate regression cases.
- The geometric annular phase of 26 January 2028 is below Ljubljana's horizon;
  its locally observable type is **partial**, not annular.
- Eclipse windows intersect the event with upper-limb rise/set times using
  standard refraction and a flat unobstructed horizon. The chart separately
  plots the body's apparent centre altitude. Mountains, buildings, weather,
  elevation and anomalous refraction are not modeled.
- Lunar contacts use Astronomy Engine's symmetric semi-durations. Contact
  labels, date changes and local-vs-UTC dates are explicit. Lunar phases are
  not the Moon's rise or set times.
- Solar obscuration is a fraction of area, not eclipse magnitude (diameter).
  It is shown only if the local maximum is above the modeled horizon.
- Perseid dates are **planning nights**, not an invented precise annual peak.
  Three nights around the typical August activity period are compared using
  astronomical darkness (Sun below −18°), lunar illumination at local
  midnight, and moon-free dark intervals. No guaranteed meteor count is given.

## Exports and rendering

`public/astronomy/` contains 135 deterministic UTC ICS files: 15 moon-phase
calendars and 120 city/year calendars (solar, lunar, Perseid planning nights).
Invisible eclipses do not create events; years with none have a disabled
download link in the UI. Stable UIDs allow repeated imports to be recognized.
Moon-phase events use a one-minute calendar duration solely to represent an
instant. Eclipse and meteor exports use the actual calculated observing
interval. UTF-8 text is folded by the iCalendar library.

The page payload contains the full supported series so the next event and
query-selected year/city can update after static export. `astronomy.js` must
remain in the exported page (`data-static-keep` in the Rails layout). Print
output contains the selected year and local detail, without the unrelated
current next-event panel.

`images.json` lists four original 1200×630 diagrams for social metadata.
Each also has a 640px desktop derivative and a separate 640px mobile layout.
The source SVGs are retained. The diagrams explicitly state that sizes and
distances are schematic; the Perseid drawing is not a positional star map.
The local-altitude SVG charts have separate desktop and mobile coordinate
systems so axis labels remain readable without horizontal scrolling.
