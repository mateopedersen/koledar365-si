# Koledar365 final audit - 23 October 2026

Status: production gates pending; no final GO yet.

## Scope
702 HTML documents; 391 public canonical URLs; 52 URL families; 69 representative template/period scenarios (not 69 distinct Rails partials). Discovery covered source output and internal links as well as sitemaps. All 98 near-duplicate candidates were classified: no exact content/title duplicates. Legitimate year/month pages were preserved.

## Finding register
| ID | Priority | Before | Remediation / evidence |
|---|---|---|---|
| F01 | P1 | Seasons landing rendered generic holidays | 16 actual equinox/solstice events, USNO references, UTC/local time; controller/partial/integration test |
| F02 | P2 | Inconsistent Slovene day/hour inflection | CLDR plural rules and decimal units; four browser projects |
| F03 | P2 | Eight-hour summary remained after changing hours | Summary follows actual daily hours; reset regression |
| F04 | P2 | Coordinates incorrectly attributed to GOV.SI list | All 69 verified; actual Wikipedia/Wikidata coordinate links |
| F05 | P2 | Newly introduced short USNO URLs returned 500 | Required parameters restored; 4 years/16 events verified |
| F06 | P1 | Two copied lunar PDFs had corrupt blocks | Manifest source verification and atomic destination repair; 10 assertions |
| F07 | P1 | Production lacked existing contrast/name corrections | Preserved main fixes; 49 baseline screen contexts to zero local violations |
| F08 | P2 | Live llms.txt returned 404 | Complete guide, 53 canonical links/10 sections, included in publication |
| F09 | P2 | Solar default date could remain on the static build day | Ljubljana today default, valid shared date preservation, invalid-date fallback and browser-history regression |
| Q01 | P1 (QA) | Occupied port could test another checkout | Server process and exact manifest verification required |
| Q02 | P2 (QA) | Error asset confused with actual HTTP 404 | Verify a genuinely absent route |
| Q03 | P2 (QA) | Valid Safari number grouping rejected | Accept both correct Slovene representations; failed evidence preserved |
| Q04 | P2 (QA) | Raw hashes rejected daily edge content | Strict actual-edition validation plus unchanged-template comparison |

| Q05 | P2 (CI) | Preview browser setup stalled on Azure package mirror | Same signed packages installed from official Ubuntu archives |

Nine product/publication findings and five QA/infrastructure safeguards are counted separately. The 49 screen contexts are not inflated into 49 independent root causes. Production closure is still pending.

## Verified local results
- 136 Rails tests / 13,873 assertions: zero failures.
- Full four-project browser suite: 464 passed, 8 intentional skips. Source/provenance changes: 52 additional sun/workday tests passed. Final midnight/leap-day/history correction: 32 sun tests passed across four projects.
- 1,200 Chromium layouts, 138 WebKit layouts, 138 axe contexts and 138 keyboard contexts/4,900 focus stops: zero failures.
- 48 months, 1,461 dates, 8 DST boundaries, 198 lunar events, 16 seasonal events and 69 coordinates: passed.
- 6,556 parsed files, 780 PDF/WebP comparisons, 108 real exports and independent file parsing: passed.

The first wrong-server run was invalidated. Safari expectation failures, a photo test executed with the wrong system Python, and corrupt destination copies remain documented; corrected reruns passed.

## Limits
No Search Console access/submission. Public contact form and required-field validation tested without sending mail; inbox delivery was not re-certified. No field INP/CrUX or human native-editor sign-off is claimed. Some external authoritative sites restrict automated access; those responses were preserved rather than treating all as dead links.
