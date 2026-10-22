# Advanced calendar expansion — 21 October 2026

## Delivery contract

Implement the attached site audit as a coherent, polished Slovenian product. Deliver source, verified static publication, source records, tests and a Work/Astra 6 release handoff. Cloudflare publication is the only final operator action; do not authenticate to or deploy Cloudflare during preparation. The final operator must return every newly added or changed live URL and verify the deployed pages and downloads.

Baseline: `e053917b0ca59ffac0ee7da537a2a6d2c8d04afd`. Working branch: `feat/advanced-calendar-expansion-20261021`.

## Work streams

| Stream | Scope | Owner | State |
| --- | --- | --- | --- |
| Calendar tools | Keep selected year/month, current 2026 support, monthly/weekly workflows, real editable XLSX | calendar agent | Implemented; local verification passed |
| Education | School calendar, official 2027 matura and NPZ, university calendar, dedicated timetable editor | education agent | Implemented; local verification passed |
| Astronomy | Current full/new moon, solar/lunar eclipse visibility, Perseid observing nights, exportable calendars | astronomy agent | Implemented; local verification passed |
| Garden | Sourced sowing windows, plant/task filters, editable personal plan, print and ICS | root | Implemented; local verification passed |
| Payments | Official ZPIZ pension and CSD transfer dates, next payment, filtered schedule, print and ICS | root | Implemented; local verification passed |
| Integration | Metadata, navigation, search, sitemap images, publication workflow and release verification | root | Implemented; local verification passed |

## Quality and content decisions

- Preserve the already verified clock-change page and original infographic.
- Preserve the intentional removal of `/imena/` and `/koledar-z-imenom/`; do not restore thousands of retired URLs.
- Godovi must not promise a verified daily saint/name calendar while its source gate is unmet. Make the existing status honest and useful.
- Only publish exam/payment years confirmed by the relevant Slovenian primary source. Never extrapolate official schedules.
- Garden windows are practical horticultural guidance with local weather/soil checks. Do not reproduce proprietary Maria Thun calendars or present biodynamic claims as established fact.
- Keep the audited printable PDF/WebP catalogue intact. Add genuine XLSX, not renamed CSV.
- Use Slovenia blue/red/white, existing local fonts, accessible controls, clear date hierarchy and tailored page layouts. Check desktop and mobile overflow, keyboard use, downloads and static behavior.
- Google Trends is relative interest, not monthly search volume. Record any unavailable data honestly. No traffic guarantee.
- The attached audit explicitly defers tax calendars; do not create unmaintained tax guidance.

## Final release record must include

1. Source and prepared publication commits, pull request and successful CI links.
2. Complete new/changed path inventory, including dependent assets and calendar downloads.
3. Official source URLs with verification date and data coverage.
4. Meaningful functional and browser test results, including editable XLSX inspection and ICS dates.
5. Work/Astra 6 prompt with the existing free Cloudflare Pages settings, exact publication commit and post-deployment URL checks.
