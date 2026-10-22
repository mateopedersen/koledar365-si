# Implemented fixes

- Named calendar, lunar-phase, workday, observance, long-weekend, leap-year and cookie tables; added header scopes. The important-day JavaScript renderer retains these semantics after filtering.
- Added explicit row roles to the shift calendar, preserving seven-day layout and actual dates. Corrected the About page definition-list children.
- Repaired low-contrast text identified by browser checks in holiday/date result panels, solar panels, family/shift planners, garden/payment tables, studio labels, horoscope captions and gallery controls.
- Removed duplicated homepage responsive-image preloads. Added a 480px AVIF for the homepage city image and responsive WebP previews for seven licensed school photographs. Original photos and print files remain untouched.
- Added `sl-SI`, accessible full weekday names and machine-readable calendar dates. Added X/Twitter image descriptions.
- Stopped copying the source-review date into `dateModified`. Static publication now stores observed content fingerprints and changes lastmod/dateModified only when meaningful HTML content changes. Unknown historical dates are omitted. A routine rebuild or asset-only change does not invent an update date.
- Removed the incorrect blanket Organization creator attribution from external illustration metadata while retaining credits.
- Added period-matching yearly breadcrumbs on monthly pages.
- Added real calendar facts, print guidance and contextual links to year/month pages; added monthly workday calculation guidance, long-weekend interpretation and full instructions/examples for day-of-year and ISO-week tools.
- Expanded editorial policy with source hierarchy, official/unpublished status, automation/AI supervision, astronomy limits and correction workflow.
- Repaired a 404 public-observation index, a refused archived astronomy citation and the museum's non-www TLS mismatch.
- Replaced identical static sample-image ALT text with the actual named layout, without claiming that a generic sample depicts the user's chosen year or private entries.
- Added repeatable structural, browser, external-link, revision-history and full-range calendar regressions.

Source files and tests are the evidence for each implementation. Final build, browser and production results are documented separately and must be checked before completion.

- The final combined-source phone crawl caught a later desktop-grid override on the shift planner. Limited that override to screens at least 901px wide; the existing mobile single-column layout now applies. Confirmed on all 391 live routes with unchanged assertions after deployment (PR #99).
