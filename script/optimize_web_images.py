"""Create responsive web copies; keep the licensed source photos untouched."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib
import json

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
OUT = PUBLIC / "images/responsive"
OUT.mkdir(parents=True, exist_ok=True)
previous = json.loads((ROOT / "data/web_image_variants.json").read_text())
images = {}
used = set()
for source in sorted((PUBLIC / "images").rglob("*")):
    if source.suffix.lower() not in (".jpg", ".jpeg", ".png") or OUT in source.parents or source.parent.name == "solar":
        continue
    source_key = "/" + str(source.relative_to(PUBLIC))
    cached = previous.get(source_key)
    # Preserve an existing editorial crop when its licensed source has not changed.
    if source.parent.name != "cities" and cached and cached["source_sha256"] == hashlib.sha256(source.read_bytes()).hexdigest() and all((PUBLIC / v["avif"].lstrip("/")).is_file() for v in cached["variants"]):
        images[source_key] = cached
        used.update(PUBLIC / v["avif"].lstrip("/") for v in cached["variants"])
        continue
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original)
        if image.width < 320 or image.height < 160:
            continue
        image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
        largest = min(image.width, 960)
        variants = []
        widths = sorted({min(image.width, 480), min(image.width, 720), largest}) if source.parent.name == "cities" else [largest]
        for width in widths:
            # Small city cards select a matching DPR variant without fetching the full-size photo.
            # The original image remains the broadly compatible fallback.
            height = round(width / 2) if source.parent.name == "cities" else round(width * image.height / image.width)
            resized = ImageOps.fit(image, (width, height), Image.Resampling.LANCZOS)
            avif_temporary = OUT / ".image.avif"
            resized.save(avif_temporary, "AVIF", quality=45, speed=6)
            avif_digest = hashlib.sha256(avif_temporary.read_bytes()).hexdigest()[:16]
            avif_destination = OUT / f"{source.stem}-{width}-{avif_digest}.avif"
            avif_temporary.replace(avif_destination)
            used.add(avif_destination)
            variants.append({"avif": "/" + str(avif_destination.relative_to(PUBLIC)), "width": width, "height": height, "avif_bytes": avif_destination.stat().st_size})
        images["/" + str(source.relative_to(PUBLIC))] = {
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "src": "/" + str(source.relative_to(PUBLIC)),
            "srcset": "/" + str(source.relative_to(PUBLIC)) + f" {image.width}w",
            "avif_srcset": ", ".join(f"{v['avif']} {v['width']}w" for v in variants),
            "width": image.width, "height": image.height,
            "variants": variants,
        }
# NASA photographs retain their full composition; only browser delivery copies change.
for source in sorted((PUBLIC / "lunar/photos").glob("*.jpg")):
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        variants = []
        for width in sorted({min(image.width, 480), min(image.width, 720), min(image.width, 1280)}):
            height = round(width * image.height / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            temporary = OUT / ".lunar.avif"
            resized.save(temporary, "AVIF", quality=48, speed=6)
            digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:16]
            destination = OUT / f"lunar-{source.stem}-{width}-{digest}.avif"
            temporary.replace(destination)
            used.add(destination)
            variants.append({"avif": "/" + str(destination.relative_to(PUBLIC)), "width": width, "height": height, "avif_bytes": destination.stat().st_size})
        images["/" + str(source.relative_to(PUBLIC))] = {
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "src": "/" + str(source.relative_to(PUBLIC)),
            "srcset": "/" + str(source.relative_to(PUBLIC)) + f" {image.width}w",
            "avif_srcset": ", ".join(f"{v['avif']} {v['width']}w" for v in variants),
            "width": image.width, "height": image.height, "variants": variants,
        }

# Holiday photographs keep their complete composition and existing WebP fallback.
for photo in json.loads((ROOT / "data/holiday_photos_sl.json").read_text())["photos"]:
    source = PUBLIC / photo["local_path"].lstrip("/")
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert("RGB")
        variants = []
        for width in sorted({min(image.width, 640), min(image.width, 960), min(image.width, 1280)}):
            height = round(width * image.height / image.width)
            resized = image.resize((width, height), Image.Resampling.LANCZOS)
            temporary = OUT / ".holiday.avif"
            resized.save(temporary, "AVIF", quality=43, speed=6)
            digest = hashlib.sha256(temporary.read_bytes()).hexdigest()[:16]
            destination = OUT / f"holiday-{source.stem}-{width}-{digest}.avif"
            temporary.replace(destination)
            used.add(destination)
            variants.append({"avif": "/" + str(destination.relative_to(PUBLIC)), "width": width, "height": height, "avif_bytes": destination.stat().st_size})
        images[photo["local_path"]] = {
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "src": photo["local_path"],
            "srcset": f"{photo['small_path']} {photo['small_width']}w, {photo['local_path']} {photo['width']}w",
            "avif_srcset": ", ".join(f"{v['avif']} {v['width']}w" for v in variants),
            "width": image.width, "height": image.height, "variants": variants,
        }
(ROOT / "data/web_image_variants.json").write_text(json.dumps(images, ensure_ascii=False, separators=(",", ":")) + "\n")
for generated in OUT.iterdir():
    if generated.suffix in (".webp", ".avif") and generated not in used:
        generated.unlink()
print(json.dumps({"source_photos": len(images), "responsive_files": len(used)}))
