# Technical validation

## Completed local checks

- The merged source passed **126 Rails tests / 13,813 assertions** with no failure, error or skip. Earlier source passed 124 / 13,686. Current calendar directory and mobile fixes from main were preserved before the final local run.
- Eight indexability-regression cases passed, including permanent redirects in macOS Python 3.9.
- Calendar fixtures cover all sixty months in 2026–2030, real day positions, Monday-first grids, ISO weeks, 29 February 2028 and independently specified Easter dates. Existing lunar, timezone, clock-change and city tests also passed.
- Node contract checks passed for search/calendar experience, astronomy, education, school holidays, lunar dates, clock boundaries, family recurrence/import/ICS, vacation rules (213 candidate periods) and student timetable timezone/RFC line folding.
- The full merged build passed all release gates: **2,820 verified PDF/WebP pairs, 208 lunar pairs, 780 calendar collection records, 1,572 redirects and 790 image-sitemap entries**. The last local full build contained 11,800 files. A subsequent one-selector directory contrast correction was checked separately and is included in the final CI source.
- The extended static inspection covered **702 HTML documents / 391 public canonical pages**, with no remaining issue in its enabled checks, no orphan public page and maximum graph depth two.
- The final rendered-browser crawl opened every public URL in desktop and mobile dimensions: **782 successful contexts, no overflow, broken visible image, unnamed visible control or JavaScript page error**.
- The 32-template accessibility pass covered **64 desktop/mobile contexts**. All enabled checks passed after the directory's targeted contrast retry. A supplementary pass with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa` also completed **64 contexts / zero violations**. Incomplete/manual checks remain recorded. This is not an accessibility certification.
- Schema.org's Code Snippet validator inspected actual exported calendar and leap-year tool JSON-LD. Both returned **zero errors and zero warnings**, covering WebPage, BreadcrumbList, ItemList, WebApplication, FAQPage and their linked organization/website/image nodes. All-page syntax, identifier and visible FAQ matching were separately checked.

## Browser regression history

The complete initial suite ran 372 checks across Chromium, WebKit, Android Chromium and iPhone WebKit: **357 passed, 7 failed, 8 intentionally skipped**. Four failures expected original JPEG URLs after previews moved to WebP. One detected that added guidance pushed printed calendars to two pages. Two were timeouts during the simultaneous audit workload.

The print guidance was excluded only from printed sheets; it remains visible in normal HTML. The photo checks now validate the actual responsive URL/srcset while retaining original source/credit assertions. A focused single-worker retry passed **22 checks**, with six intentional platform skips; it included every published monthly one-page A4 print and the full phone control crawl. No timeout was raised and no failing functional assertion was removed.

A clean merge also preserved main's mobile controls and stable PNG favicon. The merged code passed another **126 tests / 13,813 assertions** using the configured Python/Pillow image runtime. An initial supplemental run without that image runtime failed one photo test (422); no assertion was weakened, and the configured rerun passed. The About facts explanation now wraps under Arial, Verdana and generic sans-serif on a 390px viewport; the full 391-route phone control crawl passed again. Final GitHub workflow and production results are recorded separately in `live-validation.md`.

## Scope boundaries

Internal rendering fragments are transport assets with noindex, not an authentication boundary. No private personal plan data was included in the public export. Admin, search, error and unverified future pages retain their separate indexing policies. Robots directives are not described as security protection.

The Google PageSpeed API quota was unavailable; the official PageSpeed web UI worked and explicitly had no real-user dataset. All lab performance protocols are recorded separately.

## Completed Linux CI and concurrent-main merge

[Run 39795929075](https://github.com/mateopedersen/koledar365-si/actions/runs/39795929075) completed successfully: **396 passed, eight intentional platform skips, zero failures or flaky tests**. PostgreSQL tests, isolated backup/restore, production Docker boot and a real 600 ppi export, fresh static generation and all browser checks passed. The saved JSON stats identify the tested merge and PR head.

Concurrent main then required two additive style conflict resolutions (shift grid rows and school photo-credit touch targets versus the newer layout controls). Both sides were preserved. The focused merged preview passed 24 checks initially; eight other checks found two unrefreshed preview routes referencing a retired client fingerprint. After exporting those routes, the complete tablet file passed all 12 checks across four profiles; no assertion or timeout was relaxed. These were preview-only exports and were never published. A fresh full-source CI run also started for the final merged branch. PR #90 merged as `18dea609720b0d8e2ec8e986f8ebc6f436bad48f`.


## Final combined source and production verification

The combined-source run [39801051571](https://github.com/mateopedersen/koledar365-si/actions/runs/39801051571) found one real regression introduced by a later main style override: **407 passed, one failed, eight skipped**. A desktop-only two-column shift layout overrode the existing small-screen rule. It was restricted to screens at least 901px wide in [PR #99](https://github.com/mateopedersen/koledar365-si/pull/99), merged as `0f2c8f3657e73bbba60aa821e26b0e2bcb850f1c`. The original assertions and timeouts were retained.

Before merging that isolated correction, the complete 391-route phone control check passed with the candidate stylesheet, and 15 combinations of viewport width and fallback font passed. After deployment, the unmodified complete 391-route phone check passed against the actual production stylesheet in 4.1 minutes. The shared compiled CSS, runtime map, revision map and four regenerated holiday ICS files matched the verified publication byte-for-byte (JSON maps compared structurally). PDF and WebP artifacts were unchanged between the two SEO publications; the four holiday ICS changes were build DTSTAMP values only.

The final production checks also passed 16 focused functional scenarios in Chromium and iPhone WebKit: real editable XLSX output, annual workday recalculation, lunar-year selection, school-region/grade ICS scopes, matura subject/date filtering, narrow-phone education controls, keyboard search, and date suggestions. No contact message or private user plan was submitted.

The final all-page production indexability crawl passed all 391 canonical URLs; 702 HTML documents were classified. Exact duplicate content, duplicate titles, enabled indexability issues and orphan public pages: **zero**. The 98 near-duplicate candidates are retained for review; their period/city-specific data and purpose do not justify deleting working canonical pages.

The first post-release metadata probe used Python's default User-Agent and received 403. Repeating the bounded public check with the explicit audit User-Agent succeeded. A guessed revision-map path returned 404; the actual exported `/page-revisions.json` returned 200 and matched the release. These were probe limitations, not hidden successful checks or changes to Cloudflare security.

The live Google Rich Results Test crawled `/koledar/2028/februar/` successfully and found two valid eligible items (Breadcrumbs and Organization). Other valid schema types are not represented as guaranteed Google rich results.

Final-source CI result: see `current/final-ci.json` and `live-validation.md`.


The last production Lighthouse run also exposed a best-practice rule outside the WCAG tag sweep: `tabpanel` was attached directly to three fieldsets in the date calculator. PR #101 moves the role to a valid inner container and preserves the fieldsets' native disabled behavior. It also wires the school hero to the existing responsive WebP assets. The new regression checks passed on all four browser profiles (eight checks): date difference, leap-month addition, workday calculation, active-only form data, arrow-key navigation, allowed ARIA role, actual responsive image load and retained attribution. The 126-test Rails suite passed again. A first attempt named a nonexistent test file; it did not run tests and is not counted as a passing run.


The expanded axe pass also includes best-practice rules rather than only WCAG tags. It identified ambiguous homepage complementary labels, nested complementary landmarks in several named content sections, and zodiac listitem roles applied to article elements. These now use distinct labels, ordinary/named sections and valid list item containers; styling selectors were preserved where they previously depended on the aside tag. The complete updated 32-template desktop/mobile preview passed **64 contexts with zero enabled axe violations**. Twenty focused browser checks and the 126-test Rails suite passed.

A later concurrent main change added expanded shift-field and preview rules. It is preserved in the final branch. The first local merge-preview attempt lacked its new precompiled stylesheet; the browser command also ran without the required local browser permissions. Those setup failures are retained as setup failures, not passing tests or evidence of a site regression. The preview was rebuilt before the corrected browser run. No partial export is a deployment candidate.


The correctly prepared merged preview then passed **28 tests across four profiles** without changing any assertion or timeout. This includes the two additional main mobile tests. The superseded main workflow for the earlier `0f2c8f3` source was cancelled when newer main changes arrived; it is not reported as successful. The earlier completed 396-pass run and the final-source run have separate records.


Final production reruns after a30 publication: 391-route phone crawl passed in 3.0m; 782 rendered contexts / zero failures; 64 all-enabled-rule axe contexts / zero violations; 28 functional checks / all passed. Final HTTPS Lighthouse scores and regressions are retained in performance.md.


Final Linux CI [39812543509](https://github.com/mateopedersen/koledar365-si/actions/runs/39812543509) completed successfully: **436 passed, eight intentional platform skips, zero failures, zero flaky tests**. PostgreSQL, backup/restore, production Docker/600 ppi export, complete static rebuild and the full browser suite all passed. The tested source matches the merged application source. The report-only commit does not change runtime source or deployed artifacts and skips a redundant CI rerun.
