# Production verification

The full publication is live and its normal public manifest matches the tested package.

- Public origin: https://koledar365.si/
- Merged application/publication PR: https://github.com/mateopedersen/koledar365-si/pull/107
- Deployment Git commit: `82c4db6325e343e79d5dd8e526f3ce3c66c6470d`.
- Build source commit recorded in the release manifest: `d3989cd5b9334f20edff2ec905a349e63e70a52e`.
- Manifest SHA-256: `95fb25a07d6d182688baa498f34563a332c473fe38ad87635644918f48fb573d`.
- Successful Cloudflare production deployment: `68ab0aa9-146a-483b-acf5-26f446e6252d`.
- Deployment URL: https://68ab0aa9.koledar365-si.pages.dev
- Cloudflare dashboard: https://dash.cloudflare.com/48c779c8eaa80234e0bb9d57f96e588b/pages/view/koledar365-si/68ab0aa9-146a-483b-acf5-26f446e6252d
- Immutable tested preview: https://f0c78aee.koledar365-si.pages.dev
- Preview workflow: https://github.com/mateopedersen/koledar365-si/actions/runs/39864947847 — success.
- Production verification workflow: https://github.com/mateopedersen/koledar365-si/actions/runs/39865775941 — success.

The source SHA identifies the final app-code build; subsequent commits added generated output, verification and reporting. The deployment SHA identifies the merged package. They need not be identical; the manifest hash pins the actual bytes. The complete `site` output and Cloudflare Functions were deployed together through the existing Wrangler configuration. STATIC_ONLY was not used.

## Preview and production evidence

Preview: 1,768 HTML/CSS/JS/discovery files, 552 representative layouts and 138 accessibility checks passed. Preview noindex headers were verified. The operator network could not reliably reach pages.dev; GitHub's independent runner completed this gate against the immutable URL.

Production: 391 public canonical pages, 418 actual HTTP responses in the indexability crawl, 1,572 redirects, 1,200 layouts and 138 accessibility contexts passed. Full parity: **8,014 files / 2,444,114,125 bytes / zero failures**, including all 6,556 parsed download targets. See `current/production-parity/`, `current/production-browser/`, `current/seo-live/`, `current/indexability-live.json`, `current/live-redirects.json` and logs.

The live four-browser suite's first 476-scenario run had 465 passes, 8 documented skips and 3 timing failures. The affected tests were synchronized with actual page readiness and repeated three times across all four projects: 24/24 passed. Initial failures and traces remain in `current/browser-production-first/`; application assets were unchanged. The final full live repeat then passed **468 tests / 8 intentional skips / zero failures** in 8.3 minutes (`current/browser-production-final/results.json`). Full details are in `functional-test-report.md`.

Daily horoscope HTML is deliberately updated by a Cloudflare Function. Parity validates all daily fields against the actual edition generator, then compares the remaining template. Only documented daily fields and verified Cloudflare email obfuscation are normalized; arbitrary differences fail. Binary downloads require exact hashes. Real missing paths return HTTP 404; direct access to the intentional noindex error document is distinguished from a missing route.

## Integration and deployment decisions

Main advanced to automated publication `081fd910dd` during the audit. Its 773 changed paths were generated site output, editorial timestamps and audit evidence, with no application source changes. A normal merge resolved 502 generated-file conflicts by rebuilding from merged sources. Editorial records were equal except updated_at; the newer timestamp was retained. Evidence: `current/main-publication-reconciliation.json`.

The concurrent automatic rebuild run 39865776030 was cancelled after the fully verified snapshot was deployed, to prevent it replacing the measured publication during final validation. It is recorded as cancelled, not passed. Future scheduled publications remain enabled. The automatic Cloudflare attempt `be68786c` was idle; it is not the successful release. The verified production deployment is `68ab0aa9` above.

Search Console was neither opened nor submitted. Contact required-field validation was tested without sending a message or reading an inbox. Field INP/CrUX and human native-language certification are outside the evidence available here.
