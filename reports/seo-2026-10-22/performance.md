# Performance protocol and results

Measurements use two distinct environments. They must not be mixed as one before/after experiment.

1. Local static HTTP preview, Lighthouse 12.8.2, default mobile simulated throttling, one run per URL. The local server does not compress text and uses no-store; its transfer/cache diagnostics do not describe Cloudflare production.
2. Real HTTPS production URLs through Cloudflare, Lighthouse 12.8.2 with the same mobile protocol, one run per URL. Production Brotli compression was confirmed in response headers. The before-PR measurement was captured while production still served commit 777197bd7d1890a9ade64c35557b94a740e79464.
3. The official PageSpeed web UI additionally ran Lighthouse 13.5.0 on an emulated Moto G Power/Slow 4G profile. Its baseline report returned 100 in performance, accessibility, best practices and SEO, with displayed LCP 1.7s, TBT 10ms and CLS 0. It reported **No Data** for actual users. This different version/device cannot be compared numerically to the 12.8.2 runs.

The API request had zero shared quota (429), but the web interface succeeded. INP and CrUX 75th-percentile field values are not available.

Local before/after raw results are retained even where scores worsened. Home TBT was noisy in one after run while separate UI validation was active; this is not presented as proof of a code improvement or regression. A single lab score can vary. The production before/after measurements below were captured after the full live publication.

Deterministic asset improvement: seven original school photographs total 2,355,705 bytes; their largest generated web previews total 507,096 bytes (**78.5% less**). The originals, license links and high-resolution print assets remain unchanged. Smaller phone variants and a 480px homepage AVIF are also available.

All six local after templates scored 100 in Lighthouse accessibility and basic SEO. Local school LCP was 5795→5230ms; most local LCP values remained above the 2.5s target because of the uncompressed lab server. These values are not field Core Web Vitals.


## Actual production HTTPS comparison

Same Lighthouse 12.8.2 default mobile simulation, six actual public URLs, one sample per phase. The baseline was the older production source; the final publication also preserves concurrent main mobile controls/favicon changes. This table describes the combined release and does not causally attribute every score movement to SEO work.

| URL | Performance before → after | LCP ms before → after | TBT ms before → after | Accessibility before → after | SEO before → after |
|---|---:|---:|---:|---:|---:|
| `/` | 96 → 97 | 2476 → 2305 | 64 → 0 | 100 → 100 | 100 → 100 |
| `/koledar/2028/februar/` | 95 → 94 | 2432 → 2422 | 44 → 0 | 100 → 100 | 100 → 100 |
| `/lunin-koledar/2029/avgust/` | 94 → 95 | 2623 → 2357 | 42 → 0 | 100 → 100 | 100 → 100 |
| `/delovni-dnevi/2028/` | 93 → 97 | 2621 → 2283 | 36 → 0 | 92 → 100 | 100 → 100 |
| `/solske-pocitnice/` | 86 → 91 | 3756 → 3365 | 106 → 0 | 96 → 100 | 100 → 100 |
| `/datumski-kalkulator/` | 97 → 99 | 2180 → 1845 | 0 → 0 | 96 → 99 | 100 → 100 |

The monthly calendar performance score fell by one point despite a slightly lower LCP and zero measured TBT; its measured speed index was worse. That raw result is retained. Five of six final LCP values were below 2.5 seconds in this lab run. School holidays improved from 3.756s to 3.365s but remains above that lab target. All final TBT values were zero, and CLS was zero except the unchanged negligible homepage value (0.0000959). These are single lab samples; real-user INP and CrUX data remain unavailable.

The school preview byte reduction is deterministic; speed scores are variable observations. No tool, original photograph, printable export or download was removed to obtain these results.


The official PageSpeed web UI post-SEO release [report](https://pagespeed.web.dev/analysis/https-koledar365-si/xltuoflpaw?form_factor=mobile) observed **99/100/100/100** (performance/accessibility/best practices/SEO), displayed LCP 1.8s, TBT 60ms, CLS 0, FCP 1.2s and speed index 2.6s. The baseline UI run was 100/100/100/100, LCP 1.7s and TBT 10ms; the small decrease is retained. Both explicitly had no real-user dataset. This is Lighthouse 13.5.0 on Moto G Power/Slow 4G, separate from the six-template 12.8.2 protocol.

The first production 12.8.2 pass exposed two additional actionable details: the school hero alone still referenced the original JPEG, and the calculator had a best-practice ARIA role warning (outside the enabled WCAG tag sweep). They were corrected in PR #101; the unchanged raw first-release results remain available. Final focused measurements are recorded separately after that release.


The final school-hero correction changes the requested fallback from the original 233,259-byte JPEG to its existing 40,120-byte 640px WebP (**82.8% fewer bytes** for that file). The browser can choose the smaller 320px source where appropriate. This is a request/asset improvement with unchanged source credit, not a promise of a particular Lighthouse score.


## Final complete release a30dcd987b

The earlier table describes the first SEO release. The final same-protocol six-template run is below; all raw results are retained.

| URL | Performance before → final | LCP ms before → final | Final accessibility / SEO |
|---|---:|---:|---:|
| `/` | 96 → 93 | 2476 → 2745 | 100 / 100 |
| `/koledar/2028/februar/` | 95 → 98 | 2432 → 1997 | 100 / 100 |
| `/lunin-koledar/2029/avgust/` | 94 → 96 | 2623 → 2350 | 100 / 100 |
| `/delovni-dnevi/2028/` | 93 → 98 | 2621 → 1992 | 100 / 100 |
| `/solske-pocitnice/` | 86 → 93 | 3756 → 2698 | 100 / 100 |
| `/datumski-kalkulator/` | 97 → 99 | 2180 → 1926 | 100 / 100 |

All six final TBT values were zero. CLS was zero except unchanged negligible homepage 0.0000959. School LCP improved to 2.698s but remains above 2.5s in this sample; home worsened to 2.745s. Neither is hidden or replaced with the more favorable earlier sample. These are variable single lab observations. Four of six final LCP samples were below 2.5s. All six final accessibility and basic SEO scores were 100. No feature was removed to obtain scores.
