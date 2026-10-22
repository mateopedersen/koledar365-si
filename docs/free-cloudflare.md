# GitHub + Cloudflare Pages Free

No paid resources, VPS, Containers, R2, database or external hosted Rails service is required by this deployment. Static Pages requests are distinct from the Free Functions request allowance; the selected Functions routes use the existing account's allowance. Reaching a free quota does not authorize a plan upgrade.

Ruby 4.0.7 / Rails 8.1.4 produce public HTML and import verified Slovenian data. The preserved Rails app also supports its original server deployment. The free production release is not an always-running Rails server. Public content is versioned in Git; personal plans stay in localStorage with real JSON backup/restore. Photos remain in page memory. The Ruby PDF and calculation service files run in an on-demand browser worker using official ruby.wasm 2.10.1 (its browser Ruby is 4.0.0). PDF.js rasterizes that exact PDF and libwebp encodes lossless 600 ppi WebP with sRGB. The same four licensed TrueType fonts are embedded. Browser-specific large-raster memory limits are reported; no silent resolution reduction is allowed.

GitHub's existing authenticated write permissions protect editing. `/upravljanje/` links to real public-content files and Actions/history; it does not simulate an online Rails password login. Contact uses the real operator mailbox. No contact or private export database is placed in Pages or Git. Editorial files preserve actual publication dates and quality/source gates; future text is never relabelled from yesterday. Scheduled GitHub builds publish content that has actually been prepared; missing daily horoscope text is stated honestly.

Cloudflare Pages configuration: production branch main, build command `node script/verify_static.mjs`, output `site`, root repository directory. Set build variable `SKIP_DEPENDENCY_INSTALL=1`; Node is pinned by `.node-version`. The prepared output and hashes are committed. Preview deployments must be checked for noindex before production. The committed `_routes.json` contains 14 specific Functions include patterns: weather, horoscope and city detection, plus retired-name, search, sitemap and robots guards. Preserve this route list and its empty `exclude` array; do not reduce it to the weather route. Public assets outside those patterns remain static. No token/binding is needed for the weather proxy.

Production release order: wait for `Prepare verified Pages publication` to finish and commit its verified `site/` snapshot to `main`, then verify the Cloudflare Pages production deployment for that snapshot. A Pages build triggered before the generated snapshot reaches `main` can publish the previous `site/`; confirm the public URL after deployment before reporting it live.

`script/rebuild_free.rb` rebuilds public HTML from source and editorial JSON, preserves real name lastmod timestamps, checks cached print source versions, refreshes the browser Ruby package only when its deterministic payload changes, and refuses to finalize an incomplete/unverified catalogue. A changed holiday rule requires regeneration and both PDF/WebP checks before publication. Existing print fingerprints do not depend on daily horoscopes.

Rollback uses Cloudflare Pages' previous verified deployment and the matching Git commit. Public content backups are Git history; personal users must export their own JSON/ICS before clearing browser data. No automatic cross-device synchronization is claimed.

### Browser runtime recovery

A WebAssembly trap or initialization failure invalidates the entire Ruby worker.
The adapter terminates that worker and replays pending, device-local calculations
once in a fresh worker. A second failure stops with a readable Slovenian error;
Ruby validation errors are returned directly without retries. No alternative date
rules or lower-quality export are substituted. `ruby_client_test.mjs` covers the
bounded retry, concurrent requests, validation and stale-worker responses. The
browser recovery test injects an initialization trap, then requires the fresh,
real Ruby engine to calculate the April 2027 holiday range correctly.
