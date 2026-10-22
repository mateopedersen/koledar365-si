# Remaining limits and external access

- Search Console: the open account did not have access to the site property. The user explicitly chose “Search Console’u atla, diğer işleri tamamla”. No account switching, verification or indexing claims were made.
- PageSpeed Insights API returned HTTP 429 RESOURCE_EXHAUSTED with zero available shared quota. Local Lighthouse measurements are retained instead; they are not Google field data. No CrUX 75th-percentile LCP/INP/CLS claim is made.
- Several Wikimedia source/credit pages rate-limit automated HTTP checks (429); some privacy/legal sites return 403; EUR-Lex can return a 202 verification response. These are access limitations, not proof that the cited pages are broken. Full URLs/statuses are retained in the external-link report.
- One official city-register PDF timed out in the first bounded request. Retry result must be read in the final HTTP report.
- `www.koledar365.si` is not configured. No duplicate www content was served in the indexability crawl. The canonical production host remains the apex HTTPS domain.
- Official schedules not yet published remain unpublished. Date/astronomy tests validate the stated methods and selected independent fixtures; they are not a guarantee against later changes to law, official schedules, terrain or atmospheric effects.
- Automated accessibility tools cannot certify all accessibility needs. Manual keyboard and mobile review are reported separately.

Deployment and final verification are pending until their evidence is recorded. Do not interpret work-in-progress files as successful publication.
