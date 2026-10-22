# Koledar365 — full-site SEO, content and accessibility work

Date: 22 October 2026. This work preserves the Rails renderer, static publication workflow, existing design and downloads. It does not certify rankings, Google indexing, perfect Slovene or field Core Web Vitals.

## Evidence and deliverables

| Deliverable | Machine-readable evidence | Human-readable explanation |
|---|---|---|
| Full SEO audit | `baseline/full-audit.json`, `current/full-audit.json` | This report and `fix-log.md` |
| Metadata inventory | `baseline/metadata.csv`, `current/metadata.csv` | `content-quality.md` |
| Internal links | `baseline/internal-links.json`, `current/internal-links.json` | `internal-linking.md` |
| Content and search intent | `current/search-intent.csv` | `content-quality.md` |
| External source verification | `baseline/external-http.json` | `sources-and-research.md` |
| Technical validation | `current/rendered-dom.json`, `current/accessibility.json` and repository `evidence/` | `technical-validation.md` |
| Performance comparison | `baseline/performance-live-before.json`, `current/performance-comparison.json` | `performance.md` |
| All live pages | `current/live-urls.txt` | `live-validation.md` |
| Limitations | HTTP reports and recorded test responses | `remaining-issues.md` |

The baseline contained 702 HTML documents: 391 public canonical pages, 300 private rendering fragments and 11 intentionally excluded utility/error/unverified pages. The public graph had no orphan pages and a maximum shortest-path depth of two clicks. All 391 sitemap URLs passed the baseline HTTP/indexability crawl. Existing PRs #52, #56 and #58 were verified as merged; removed name/day pages remain removed and their data was not republished.

`sl` was already a valid language tag. Changing it to the explicitly requested `sl-SI` is a regional refinement, not a claim that 391 pages were previously ineligible for indexing. The actual structural findings were 129 unnamed tables, 75 missing header scopes and one repeated homepage image preload. Accessibility and source findings discovered during subsequent browser checks are recorded separately.

## Reproduction

```sh
bundle exec rails test
python3 test/test_indexability.py
bundle exec ruby script/rebuild_free.rb
SEO_STRICT=1 bundle exec ruby script/audit_full_seo.rb
node script/audit_seo_browser.mjs
node script/audit_seo_accessibility.mjs
# Include axe best-practice rules as well as WCAG checks:
node reports/seo-2026-10-22/reproduce/audit-accessibility-all-rules.mjs
pnpm exec playwright test
python3 script/audit_indexability.py --live --output reports/seo-2026-10-22/current/indexability-live.json
```

Use the repository's pinned Ruby/Node toolchain, `PYTHON_BIN` with Pillow for rendering and the static preview server for browser checks. HTTP checks record rate limits and access restrictions explicitly; they do not remove valid citations merely because a remote service blocks automated requests.


## Completed implementation scope

391 public canonical pages receive shared technical/semantic/social improvements. Body content was enriched on 112 URLs: 56 annual/monthly calendars, 48 monthly workday pages, five long-weekend pages, two date-number tools and editorial policy. Fifty-two descriptions changed; existing good titles were preserved. `current/url-change-inventory.json` separates these scopes and lists the actual URLs. The graph contains 21,653 distinct per-page target edges, with no orphan public page and maximum shortest path two.

The final live indexability results, real downloadable-file checks, rendered/browser evidence, Cloudflare identifiers, truthful CI history and remaining external limits are documented in `live-validation.md`, `technical-validation.md` and `remaining-issues.md`. The Turkish response to the requested 15 delivery questions is in `sonuc-raporu.md`.


Final Linux CI [39812543509](https://github.com/mateopedersen/koledar365-si/actions/runs/39812543509) completed successfully: **436 passed, eight intentional platform skips, zero failures, zero flaky tests**. PostgreSQL, backup/restore, production Docker/600 ppi export, complete static rebuild and the full browser suite all passed. The tested source matches the merged application source. The report-only commit does not change runtime source or deployed artifacts and skips a redundant CI rerun.
