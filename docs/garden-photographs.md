# Garden crop photographs

The 16 crop rows on `/setveni-koledar/` use real photographs, self-hosted in
`public/garden/photos/`. These are SVG containers with an embedded optimized
WebP photograph, not traced illustrations or generated photographs. The vector
frame remains sharp and the embedded photograph is large enough for the 56–64 px
row thumbnails and 112 px expanded detail. No third-party image request is made.

`public/garden/photos.json` records the photographer, original Commons page,
license link, original dimensions, downloaded-image hash, embedded-WebP hash,
SVG hash, adaptations, and review date for each crop. The attribution is both
inside each SVG and visible at `/fotografije-in-licence/#fotografije-vrtnin`.
Creative Commons ShareAlike terms continue to apply to the adapted photographs.

Photographs identify the crop, not a particular cultivar, sowing date, or seed
material specification. The early and winter lettuce records intentionally use
the same butterhead photograph. Onion bulbs illustrate the onion-set record;
the credit page states this distinction. The garden hero remains separately
identified as an AI-generated illustration.

Reviewed 22 October 2026. All choices were inspected as photographs of raw crops;
prepared dishes, botanical drawings, unrelated species and unsuitable licenses
were excluded. The collection distinguishes cabbage and Savoy cabbage, celeriac,
corn salad, spinach, and chard.

The browser regression checks all 16 SVG MIME types, image decoding, embedded
WebP signatures and hashes, attribution links, accessible button names,
expand/collapse behavior, filters, and label layout at four viewport widths on
all configured browser profiles. Existing garden plan and export tests remain.
