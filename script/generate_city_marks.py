"""Build compact, photo-based SVG marks from the attributed city photographs."""
from pathlib import Path
from PIL import Image, ImageOps
from xml.sax.saxutils import escape
import base64
import hashlib
import io
import json

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUTPUT = PUBLIC / "images/city-marks"
MANIFEST = ROOT / "data/city_mark_assets.json"
SIZE = (160, 128)

OUTPUT.mkdir(parents=True, exist_ok=True)
cities = json.loads((ROOT / "data/cities_sl.json").read_text())["cities"]
rows = []

for city in cities:
    photo = city["photo"]
    source = PUBLIC / photo["local_path"].lstrip("/")
    source_digest = hashlib.sha256(source.read_bytes()).hexdigest()
    if source_digest != photo["sha256"]:
        raise SystemExit(f"Source photo checksum changed for {city['name']}")

    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        image = ImageOps.fit(image, SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.48))
        import io
        thumbnail = io.BytesIO()
        image.save(thumbnail, "JPEG", quality=68, optimize=True, progressive=True)
    encoded = base64.b64encode(thumbnail.getvalue()).decode("ascii")
    title = escape(f"Fotografija mesta {city['name']}")
    description = escape(f"Fotografija mesta {city['name']}.")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{SIZE[0]}" height="{SIZE[1]}" viewBox="0 0 {SIZE[0]} {SIZE[1]}" role="img" aria-labelledby="title desc">
  <title id="title">{title}</title>
  <desc id="desc">{description}</desc>
  <defs><clipPath id="photo"><rect x="1" y="1" width="158" height="126" rx="15"/></clipPath></defs>
  <rect width="160" height="128" rx="16" fill="#eaf1f8"/>
  <image x="1" y="1" width="158" height="126" preserveAspectRatio="xMidYMid slice" clip-path="url(#photo)" href="data:image/jpeg;base64,{encoded}"/>
  <rect x="1" y="1" width="158" height="126" rx="15" fill="none" stroke="#ffffff" stroke-opacity=".72" stroke-width="2"/>
  <g aria-hidden="true"><rect x="10" y="114" width="48" height="7" rx="3.5" fill="#102d50" fill-opacity=".72"/><path d="M14 117.5h13" stroke="#1766a4" stroke-width="3" stroke-linecap="round"/><path d="M29 117.5h13" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M44 117.5h10" stroke="#d62e43" stroke-width="3" stroke-linecap="round"/></g>
</svg>
'''
    destination = OUTPUT / f"{city['id']}.svg"
    destination.write_text(svg, encoding="utf-8")
    rows.append({
        "id": city["id"], "name": city["name"], "path": "/images/city-marks/" + destination.name,
        "source": photo["source"], "author": photo["author"], "license": photo["license"],
        "source_sha256": source_digest, "thumbnail_sha256": hashlib.sha256(thumbnail.getvalue()).hexdigest(),
        "svg_sha256": hashlib.sha256(destination.read_bytes()).hexdigest(),
        "embedded_jpeg_bytes": len(thumbnail.getvalue()),
    })

MANIFEST.write_text(json.dumps({"count": len(rows), "cities": rows}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"city_marks": len(rows), "embedded_photo_bytes": sum(row["embedded_jpeg_bytes"] for row in rows), "manifest": str(MANIFEST)}))
