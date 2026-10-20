Lunar calendars 2027–2030

The Ruby application consumes immutable JSON in data/lunar and prebuilt assets in public.
GitHub Actions keeps using script/rebuild_free.rb, and Cloudflare Pages serves site/.
No Python renderer or Ruby server runs on Cloudflare. No new hosting service is required.
All 53 existing /lunin-koledar/ routes are preserved. Other lunar routes keep their original view.

Normal web build:
  bundle exec ruby script/lunar/prepare.rb
  bundle exec ruby script/rebuild_free.rb
Data and assets are tracked so a fresh clone can build without downloading astronomy kernels.

Heavy scientific reproduction (outside the web build):
  Create a Python venv and install script/lunar/requirements.txt.
  Download the files below into ../lunar-sources, verifying SHA-256 values in
  evidence/lunar/render-report-2027.json before running them as data inputs.
  python data/lunar/cross_validate_jpl.py --ephemeris ../lunar-sources/de440s.bsp
  node script/lunar/audit_dates.mjs
  python script/lunar/render_moons.py --sources ../lunar-sources --year 2027
  Repeat rendering for 2028, 2029, 2030. Masters go to ../moon-masters, outside public/.
  python script/lunar/audit_geometry.py --sources ../lunar-sources
  python script/lunar/pack_moons.py
  python script/lunar/print_calendars.py --profile public/lunar/licenses/default_cmyk.icc --year 2027
  Repeat printing for 2028, 2029, 2030.
  python script/lunar/audit_assets.py
  Review every generated PDF proof before setting renderQaStatus to passed.
  bundle exec ruby script/lunar/inventory_text.rb
  Review generated Slovenian text in context, then run each language review pass.
  REQUIRE_LUNAR_DOWNLOADS=1 bundle exec ruby script/lunar/audit_pages.rb

Sources:
https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp
https://naif.jpl.nasa.gov/pub/naif/generic_kernels/pck/moon_pa_de440_200625.bpc
https://naif.jpl.nasa.gov/pub/naif/generic_kernels/fk/satellites/moon_de440_250416.tf
https://naif.jpl.nasa.gov/pub/naif/generic_kernels/lsk/naif0012.tls
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_16bit_srgb_8k.tif
https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/ldem_16.tif
https://aa.usno.navy.mil/api/moon/phases/year?year=2027 (repeat for each year)

NASA credit: NASA's Scientific Visualization Studio; LROC and LOLA surface products.
The visually processed color map is not a measured photometric calibration.
Geocentric, lunar north up, DE440 ME421 coordinates; local noon in Europe/Ljubljana.
The renderer uses DEM normals and sampled terrain shadows, with Lommel–Seeliger reflectance.
It does not simulate eclipses, Earthshine, atmospheric seeing or a local horizon.
Future time-zone and leap-second changes require deliberate data revalidation.

PDF: vector text/lines, embedded DejaVu, ICC-converted CMYK, Artifex SWOP OutputIntent,
600 or greater effective ppi for every placed raster. No PDF/X certification claim.
The embedded ICC profile and its source are distributed with their original AGPL notices
in public/lunar/licenses; its source repository is https://github.com/ArtifexSoftware/ghostpdl.
The DejaVu license is also included. No licensed Avenir file was supplied; the website uses
Avenir when installed locally and the print uses redistributable DejaVu Sans.

WebP: sRGB, 600 ppi-equivalent A4/A3 dimensions, same layout and source images as PDF.
The 333 lossless atlas/cover files preserve all 1,461 daily images while keeping the complete
existing site within the Cloudflare Free file-count cap. Do not publish moon-masters/.
Individual source PNG/WebPs can be regenerated or recovered from lossless atlas crops.

Validation reports distinguish actual checks from physical printer, physical device,
Search Console and native-speaker reviews that were not run. The language review was by
Codex, with generated-instance checks; it is not a human editorial certificate.
