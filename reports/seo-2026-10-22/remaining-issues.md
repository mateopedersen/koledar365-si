# Remaining limits and external access

- Search Console: the open account did not have access to the site property. The user explicitly chose “Search Console’u atla, diğer işleri tamamla”. No account switching, verification or indexing claims were made.
- The PageSpeed Insights API returned HTTP 429 RESOURCE_EXHAUSTED with zero available shared quota. The official web interface worked: its before-deployment mobile report is saved in baseline/pagespeed-web-before.json. It explicitly reported “No Data” for real users. Lighthouse and PageSpeed lab results are not CrUX 75th-percentile field measurements; INP was not measured.
- Several Wikimedia source/credit pages rate-limit automated HTTP checks (429); some privacy/legal sites return 403; EUR-Lex can return a 202 verification response. These are access limitations, not proof that the cited pages are broken. Full URLs/statuses are retained in the external-link report.
- The official city-register PDF timed out again in the bounded retry. The Uradni list summer-time regulation returned 503; its regulation identifier was checked, but availability could not be confirmed. Existing official EU references remain. These external-service failures are not presented as repaired or successful checks.
- `www.koledar365.si` is not configured. No duplicate www content was served in the indexability crawl. The canonical production host remains the apex HTTPS domain.
- Official schedules not yet published remain unpublished. Date/astronomy tests validate the stated methods and selected independent fixtures; they are not a guarantee against later changes to law, official schedules, terrain or atmospheric effects.
- Automated accessibility tools cannot certify all accessibility needs. Manual keyboard and mobile review are reported separately.

The production deployment completed and was recrawled. See `live-validation.md` for the exact source, deployment and test records. External access limits above remain explicit; they were not silently counted as successful checks. All published canonical pages are technically indexable in the enabled crawl checks; this does not establish that Google has already indexed them.


A concurrent branding PR #100 merged after this verified SEO publication, followed by generated publication 06adce1. Its source/artifacts are preserved by the report-only commit. The measurements and 436-pass CI above identify the tested SEO release explicitly; they do not claim to test later independent branding work.
