# Sources, external checks and search intent

Reviewed 22 October 2026. The complete baseline HTTP check covers 310 distinct external URLs, with response status, redirect chain, destination and referring pages. Restricted responses and timeouts are retained; HTTP 200 alone is not a guarantee of factual relevance.

Primary data sources checked:

- [GOV.SI — holidays and nonworking days](https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/).
- [GOV.SI — primary-school calendar](https://www.gov.si/teme/solski-koledar-za-osnovne-sole/) and [secondary-school calendar](https://www.gov.si/teme/solski-koledar-za-srednje-sole/).
- [RIC — general matura](https://www.ric.si/splosna-matura/koledar-splosne-mature/), [vocational matura](https://www.ric.si/poklicna-matura/koledar-poklicne-mature/) and [NPZ information](https://www.ric.si/nacionalno-preverjanje-znanja/splosne-informacije/).
- Existing directly cited ZPIZ/CSD payment schedules and USNO phase tables are preserved with their original scope. The HTTP inventory includes their exact URLs.
- [ISO — date/time format](https://www.iso.org/iso-8601-date-and-time-format.html) supports the date/week tool's reference link. The site calculates ISO weeks with tested date routines; it does not reproduce the standard.

Repaired citations:

- Public observations: `https://portalvvesolje.si/dogodki/2026/` returned 404; use the site's actual [events index](https://portalvvesolje.si/dogodki).
- A refused archived Perseids page is replaced by the current Portal v vesolje August 2026 article. Its title/year are explicit so a historical observing description is not presented as a new-year prediction. The page may present bot verification.
- The Slovenian Ethnographic Museum URL uses its verified `www` host, avoiding the non-www TLS hostname mismatch.

Google documentation reviewed at its current official URLs:

- [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Search Essentials](https://developers.google.com/search/docs/essentials)
- [Title links](https://developers.google.com/search/docs/appearance/title-link)
- [Descriptions/snippets](https://developers.google.com/search/docs/appearance/snippet)
- [Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Image SEO](https://developers.google.com/search/docs/appearance/google-images)
- [Structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)

Implementation follows visible content, descriptive metadata, crawlable anchors, actual source attribution and truthful modification history. Valid schema and Google rich-result eligibility are assessed separately. No FAQ rich-result or ranking guarantee is made.

## Search intent observations

Search queries examined calendar-year, lunar-calendar, monthly/weekly printing, workday/holiday and date-tool groups. The result landscape distinguishes yearly calendars, holiday legal status, monthly workday funds, downloadable templates and astronomical phase dates. This supports keeping useful year/month detail pages separate from category/tool pages.

No query volumes, Search Console clicks/impressions/CTR or ranking changes were available. `current/search-intent.csv` maps every actual public URL to its topic, useful user action, metadata, headings, current structured-data types and related destinations; it is an implementation map, not a claim of measured traffic.
