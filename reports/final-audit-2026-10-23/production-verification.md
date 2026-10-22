# Production verification

Status: preview/production gates pending; no final GO yet.

The complete package contains 391 public canonical pages. `preview-target.json` pins the immutable Cloudflare preview and its manifest SHA-256. The operator network cannot complete pages.dev connections, so an independent GitHub runner verifies every HTML/CSS/JS file and renders representative pages.

Daily horoscope HTML is deliberately updated by a Cloudflare Function. The parity gate validates all daily fields against the actual edition generator for that date, then compares the remaining template. Only documented daily fields and verified Cloudflare email obfuscation are normalized; arbitrary content differences fail.

Main advanced to automated publication 081fd910dd during testing. Its 773 changed paths were generated site output, editorial timestamps and audit evidence only; no application source changes. The normal merge had 502 generated-file conflicts. Output was regenerated from merged sources. Editorial records were proven equal except updated_at, for which the newer timestamp was retained. See current/main-publication-reconciliation.json.
