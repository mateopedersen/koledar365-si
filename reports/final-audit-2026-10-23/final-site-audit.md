# Koledar365 final audit - 23 October 2026

FINAL STATUS: GO — READY FOR GOOGLE SUBMISSION

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
| Q06 | P2 (QA) | Live WebKit tests sampled an asynchronously replaced table / cancelled an unrelated weather request on navigation | Await actual readiness, retain exact CSS/error assertions; 24/24 repeated checks passed |
| O01 | P2 (open observation) | School mobile lab LCP 3.05 s, above 2.5 s target | Final 2.66 s; non-blocking performance follow-up, no field INP available |

Sixteen groups are recorded: nine product/publication fixes, six QA/infrastructure safeguards, and one remaining non-blocking P2 laboratory-performance observation. Fifteen groups are resolved. No observed P0/P1 remains. The 49 screen contexts are not inflated into 49 independent root causes.

## Verified local results
- 136 Rails tests / 13,873 assertions: zero failures.
- Full four-project browser suite: 468 passed, 8 intentional skips. Source/provenance changes: 52 additional sun/workday tests passed. Final midnight/leap-day/history correction: 32 sun tests passed across four projects.
- 1,200 Chromium layouts, 138 WebKit layouts, 138 axe contexts and 138 keyboard contexts/4,900 focus stops: zero failures.
- 48 months, 1,461 dates, 8 DST boundaries, 198 lunar events, 16 seasonal events and 69 coordinates: passed.
- 6,556 parsed files, 780 PDF/WebP comparisons, 108 real exports and independent file parsing: passed.

The first wrong-server run was invalidated. Safari expectation failures, a photo test executed with the wrong system Python, and corrupt destination copies remain documented; corrected reruns passed.

## Limits
No Search Console access/submission. Public contact form and required-field validation tested without sending mail; inbox delivery was not re-certified. No field INP/CrUX or human native-editor sign-off is claimed. Some external authoritative sites restrict automated access; those responses were preserved rather than treating all as dead links.

## Verified production results

- PR #107 merged; deployed commit `82c4db6325e343e79d5dd8e526f3ce3c66c6470d`.
- Cloudflare deployment `68ab0aa9-146a-483b-acf5-26f446e6252d`; exact normal public release-manifest SHA verified.
- Preview workflow 39864947847, production verification workflow 39865775941, source quality workflow 39864947827 and the complete production-commit quality workflow 39865776062 succeeded.
- 391 public canonical URLs, 418 indexability HTTP responses, 1,572 redirects: passed.
- 8,014 live file comparisons including 6,556 downloads / 2,444,114,125 bytes: zero failures.
- 1,200 live layouts and 138 live axe contexts: passed.
- First full live browser suite: 465 pass / 8 intentional skip / 3 timing failures; affected tests corrected and repeated across four projects three times, 24/24 pass. Original traces and assertions retained. Final full live rerun: **468 passed / 8 intentional skip / zero failures**. See functional-test-report.md.
- Six mobile Lighthouse lab measurements: performance 93–98, accessibility/SEO 100, CLS 0. School LCP 2.66 s remains above the 2.5 s goal; other five pages meet it in this run. No field INP claim.

No duplicate public page was deleted because no exact duplicate was found. All 98 near-duplicate candidates were reviewed; legitimate period pages remain separate. 300 client fragments and 11 support documents retain deliberate index exclusions. `/llms.txt` now returns HTTP 200 with 53 canonical links in 10 sections.

The detailed release identity, parity methodology, integration decisions, initial failed runs and remaining evidence limits are in production-verification.md and the other twelve deliverables.

## Source, test and live-page mapping

| Finding | Source / safeguard | Test evidence | Live destination |
|---|---|---|---|
| F01 | `app/controllers/pages_controller.rb`, `app/views/pages/_seasons.html.erb` | `current/season-sources.json`, independent calendar audit, Rails integration tests | https://koledar365.si/letni-casi/ |
| F02–F03 | `app/assets/javascripts/workdays.js` | `baseline/workdays-regression-before.txt`, final four-browser unit/summary regressions | https://koledar365.si/kalkulator-delovnih-dni/ and https://koledar365.si/delovni-dnevi/2028/ |
| F04 | `data/cities_sl.json`, `app/views/pages/_sun.html.erb`, `app/assets/javascripts/sun.js` | `current/city-coordinates-validation.json`, 69 source matches and selected-city link tests | https://koledar365.si/soncni-vzhod-in-zahod/ljubljana/ |
| F05 | `app/views/pages/_seasons.html.erb` | `current/season-sources.json`: four successful source pages, 16 event matches | https://koledar365.si/letni-casi/ |
| F06 | `lib/verified_asset_copy.rb`, `script/lunar/sync_verified_assets.rb` | Atomic-copy regression, parsed download CSV, exact production file hashes | https://koledar365.si/lunin-koledar/2027/ |
| F07 | Preserved `app/assets/stylesheets/navigation.css`, `app/views/layouts/_navigation.html.erb` changes from main (6b7059a358 / 9887e91f00) | Baseline 49 failing contexts; `current/production-browser/a11y-chromium.json`: zero failures | https://koledar365.si/ and all public page templates |
| F08 | Preserved guide generation plus complete `site/llms.txt` publication | `current/seo-live/summary.json`: HTTP 200 and 53 guide links | https://koledar365.si/llms.txt |
| F09 | `app/assets/javascripts/sun.js` | `current/logs/sun-midnight-before.log`, 32 fixed-date/invalid-date/history cases | https://koledar365.si/soncni-vzhod-in-zahod/ljubljana/ |

Before/after mobile screenshots, raster contact sheets and all machine-readable evidence are retained under `baseline/` and `current/`. Shared design was preserved; source code fixes were applied only where a verified defect existed.

All 13 deliverables and closing evidence are recorded in [PR #108](https://github.com/mateopedersen/koledar365-si/pull/108), following the deployed application/publication [PR #107](https://github.com/mateopedersen/koledar365-si/pull/107). The report follow-up does not change the published application bytes.
