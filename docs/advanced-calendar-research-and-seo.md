# Research, content decisions and SEO implementation

Reviewed: 21 October 2026. Site: https://koledar365.si/.

## What the expansion is intended to accomplish

Each new canonical page serves a distinct practical task. The editorial titles use native Slovene search vocabulary; tools provide an answer and an action, not only an explanatory paragraph. Traffic potential is a qualitative prioritization, not a forecast or verified monthly keyword volume.

| Intent | Canonical destination | Useful differentiation |
| --- | --- | --- |
| setveni koledar, vrtnarski koledar | `/setveni-koledar/` | 16 plants, task/month/method filters, sourced seasonal windows and a private garden plan |
| šolski koledar | `/solski-koledar/` | School year, school level, grade and winter region; real printable/ICS selection |
| matura 2027 | `/matura/2027/` and two specific exam-type pages | Official RIC dates, subjects, spring/autumn sessions and personal selection |
| NPZ 2027 | `/npz/` and grade 3/6/9 pages | Different exam/result/inspection dates remain distinct |
| študijski koledar | `/studijski-koledar/` | Published institutional frameworks and explicit faculty limits |
| šolski urnik | Existing `/solski-urnik/` rebuilt | Purpose-specific lesson fields, overlap checking, term/DST-aware ICS and backup |
| izplačila pokojnin | `/izplacila-pokojnin/` | Official ZPIZ dates, next published payment, real export; no inferred next year |
| izplačila socialnih transferjev | `/izplacila-socialnih-transferjev/` | Actual CSD payment column, not internal entry cutoffs; benefits filter |
| sončni mrk, sončev mrk | `/soncni-mrk/` | Local visibility above the horizon and event contacts for eight Slovenian cities |
| lunin mrk | `/lunin-mrk/` | Local visibility, cross-midnight dates and meaningful visual timeline |
| perzeidi | `/perzeidi/` | Three observing nights, darkness and moon conditions; no invented future exact peak |
| polna luna, mlaj, lunine mene | Existing dedicated pages rebuilt | Current-year support, correct Slovenia instant, year selection and real ICS |
| mesečni / tedenski koledar | Existing hubs rebuilt | Interactive period selection, notes, PDF, real editable XLSX for monthly/annual calendars |
| premik ure | Existing verified implementation preserved | Accurate spring/fall diagram, next transition, dates and ICS |

## Google Trends: observed limitation, not invented evidence

The Slovene Google Trends Explore interface was opened with **Slovenija**, **Spletno iskanje**, five search terms (`koledar`, `lunin koledar`, `setveni koledar`, `prazniki`, `šolske počitnice`) and both the last twelve months and the last five years. The actual chart panels returned **“Ojoj, nekaj se je zalomilo. V kratkem poskusite znova.”** No numerical series, related-query export or monthly search volumes were available in this session. No topic ranking in this release is presented as a measured Trends result.

Verified comparison URL:
https://trends.google.com/trends/explore?date=today%205-y&geo=SI&q=koledar,lunin%20koledar,setveni%20koledar,prazniki,%C5%A1olske%20po%C4%8Ditnice&hl=sl

Google's Slovene explanation of normalization and sampling:
https://support.google.com/trends/answer/4365533?hl=sl

For later measurement, compare related queries within the same country/time/category/search-type selection. Separate Web Search and Image Search. Trends values are relative interest, not absolute monthly search volume; a zero is not proof that nobody searches a term. Search Console, if the operator has access, can later show actual impressions/clicks by landing page and query. No Search Console account was accessed during preparation.

## Source basis and coverage

### Education

`docs/education-calendar-2026-2027.md` and `public/education/data.json` contain the thirteen Slovene primary source URLs, 239 structured events, scope limitations and source associations for every event. Only published 2026/2027 and 2027 exam dates are included.

### Payments

- ZPIZ: https://www.zpiz.si/cms/content2019/izplailni-dnevi
- CSD: https://www.csd-slovenije.si/csd-savinjsko-saleska/obvestila/terminski-plan-izplacil-javnih-transferjev-za-leto-2026/

Twelve pension dates and 151 social-transfer dates are recorded in `public/payments/data.json`, with source hashes and verification date. The December pension date is **29 December 2026**. One social-payment event from the December 2026 plan falls on **5 January 2027**; it is not represented as a confirmed full 2027 schedule. The importer distinguishes the desktop payment tables from duplicated mobile tables and validates weekdays. No entitlement or amount advice is generated.

### Gardening

- https://www.klubgaia.com/si/vrtnarski-nasveti/4264-Vzgojimo-si-svoje-sadike
- https://www.klubgaia.com/si/vrtnarski-nasveti/887-Setve-in-sajenje-za-jesensko-zimske-dni
- https://www.klubgaia.com/si/vrtnarski-nasveti/853-Jesensko-sajenje-cesna
- https://www.kmetijskizavod-ng.si/panoge/poljedelstvo_in_zelenjadarstvo/2017060814095258/strokovni_nasveti/

Source links to Vrt Obilja and the Gaia/Marija Thun calendar are provided as original works; their proprietary daily schedules are not copied. Months are horticultural windows for the named crop cycle, primarily continental Slovenia. Region selection explains differences instead of fabricating a uniform day offset. Users choose their personal dates. Biodynamic claims are not stated as established agronomic facts.

### Astronomy and working days

Slovene astronomy source URLs are recorded in `AstronomySchedule::SOURCES`; computed contacts/local conditions are clearly identified as a model. USNO and Astronomy Engine are identified as technical data/computation dependencies, not passed off as Slovene editorial sources. Checking sample events against Slovene observations is not described as independently confirming every future event. Lunar UT1/UTC precision, local horizon assumptions and local-time conversion are explained.

2026 nonworking dates follow PISRS ZPDPD and the government OPSI dataset. Future years follow current legal rules and may change if the law changes. The existing pre-rendered 2027–2030 PDF/WebP catalog remains unchanged.

## SEO and trust implementation

- Unique Slovene title and description per intent in `ExpansionCatalog`, `EducationCalendar`, `GardenCalendar` and `PaymentCalendar`.
- One H1 per rendered page; visible source and coverage information; source links lead to the actual institution/publication.
- Canonical production URLs; query-selected states share the appropriate canonical rather than creating duplicate indexable URLs.
- Public search, home discovery and tools index link the new pages. All indexable canonical pages enter the sitemap and complete release URL inventory.
- Original diagrams/illustrations have descriptive filenames, contextual alt text, dimensions, appropriate mobile variants and image sitemap entries.
- `WebPage`, truthful `Organization`, `BreadcrumbList`, appropriate `WebApplication` and `ImageObject` schema. `FAQPage` only mirrors questions and answers visibly available on that page.
- No invented experts, testimonials, qualifications, ratings or authority. No “Google certified”, guaranteed ranking, or guaranteed FAQ rich-result claim.
- `/viri-in-metodologija/` explains editorial responsibility, source types, update limits, time zones, computation, images and corrections.
- Privacy copy reflects the actual browser-local export/plan architecture. Sharing a URL can expose its query parameters; local notes and photos are not silently described as uploaded.
- Existing intentional removal of `/imena/` and `/koledar-z-imenom/` is preserved in routes, search export and sitemap. The original keyword idea is not used to restore thousands of retired name URLs.
- The unverified godovi dataset remains gated. Tax calendars remain deferred, as requested by the attached audit.

Google's primary technical guidance used for implementation:
https://developers.google.com/search/docs/fundamentals/creating-helpful-content
https://developers.google.com/search/docs/fundamentals/seo-starter-guide

E-E-A-T is addressed through accountable, useful and verifiable content. It is not a numerical score or a single direct ranking factor that a page can be certified to pass. Technical checks can verify implementation; they cannot promise crawling, indexing, image placement or search rankings.

## Visual asset provenance

The garden hero is an original AI-generated editorial illustration for this release: tomato/lettuce seedlings, seeds, garlic, blue tray and a red hand tool on a light garden work surface, natural Slovenian garden atmosphere, no text, no logos and no people. The visible caption and image metadata disclose its illustrative/AI origin. Production serves optimized WebP variants at 640, 1200 and 1536 pixels, not the large generation source.

Payment diagrams are drawn from the verified date JSON by `script/payments/build_infographics.py`. Astronomy diagrams are original SVG/WebP explanatory graphics with a schematic/not-to-scale disclosure. Exact dates, axes and labels use code-rendered graphics, not generated image text.

Screenshots in `docs/previews/` come from the rendered implementation. They show desktop/mobile designs; they are not evidence that the production domain has been deployed.
