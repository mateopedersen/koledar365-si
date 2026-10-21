#!/usr/bin/env python3
"""Independently validate the supplied calendar originals before publication."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from PIL import Image
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "calendar-collection"
ORIGINALS = DATA / "originals"
SEO = json.loads((DATA / "seo-podatki.json").read_text(encoding="utf-8"))
QC = json.loads((DATA / "kontrola-kakovosti.json").read_text(encoding="utf-8"))
QC_BY_PAIR = {(row["pdf"], row["webp"]): row for row in QC["datoteke"]}
def digest(file: Path) -> str:
    result = hashlib.sha256()
    with file.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            result.update(chunk)
    return result.hexdigest()


def font_resources_embedded(resources: dict) -> bool:
    fonts = resources.get("/Font", {}).get_object()
    if not fonts:
        return False
    for reference in fonts.values():
        font = reference.get_object()
        descriptors = [font.get("/FontDescriptor")]
        for descendant in font.get("/DescendantFonts", []):
            descriptors.append(descendant.get_object().get("/FontDescriptor"))
        if not any(descriptor and any(key in descriptor.get_object() for key in ("/FontFile", "/FontFile2", "/FontFile3")) for descriptor in descriptors):
            return False
    return True


def main() -> None:
    if len(SEO["datoteke"]) != 780 or len(QC_BY_PAIR) != 780:
        raise SystemExit("Both supplied collection reports must describe exactly 780 pairs.")
    if QC["napake_pri_koncni_kontroli"] != 0 or QC["opozorila_pri_koncni_kontroli"] != 0:
        raise SystemExit("The source collection's completed quality gate contains warnings or errors.")

    rows = []
    failures = []
    decoded_pixels = 0
    for index, record in enumerate(SEO["datoteke"], 1):
        q = QC_BY_PAIR[(record["pdf"], record["webp"])]
        pdf = ORIGINALS / record["pdf"]
        webp = ORIGINALS / record["webp"]
        checks = {
            "pdf_exists": pdf.is_file(), "webp_exists": webp.is_file(),
            "pdf_bytes": pdf.stat().st_size if pdf.is_file() else None,
            "webp_bytes": webp.stat().st_size if webp.is_file() else None,
            "pdf_sha256": digest(pdf) if pdf.is_file() else None,
            "webp_sha256": digest(webp) if webp.is_file() else None,
            "expected_pdf_sha256": q["pdf_sha256"], "expected_webp_sha256": q["webp_sha256"],
            "pixel_identity": q["ujemanje_vseh_pikslov"],
        }
        checks["pdf_hash_matches"] = checks["pdf_sha256"] == q["pdf_sha256"]
        checks["webp_hash_matches"] = checks["webp_sha256"] == q["webp_sha256"]
        checks["pdf_size_matches"] = checks["pdf_bytes"] == record["pdf_velikost_bajtov"]
        checks["webp_size_matches"] = checks["webp_bytes"] == record["webp_velikost_bajtov"]
        try:
            reader = PdfReader(pdf, strict=True)
            if len(reader.pages) != 1:
                raise ValueError(f"Expected one A3 page, got {len(reader.pages)}")
            page = reader.pages[0]
            box_width = float(page.mediabox.width)
            box_height = float(page.mediabox.height)
            expected_width = 420 if record["sirina_px"] > record["visina_px"] else 297
            expected_height = 297 if expected_width == 420 else 420
            width_mm = box_width * 25.4 / 72
            height_mm = box_height * 25.4 / 72
            output_intent = reader.trailer["/Root"].get("/OutputIntents", [])[0].get_object()
            resources = page["/Resources"].get_object()
            default_cmyk = resources.get("/ColorSpace", {}).get_object().get("/DefaultCMYK")
            default_cmyk_profile = default_cmyk[1].get_object() if default_cmyk and len(default_cmyk) == 2 else {}
            destination_profile = output_intent.get("/DestOutputProfile").get_object()
            checks.update({
                "pdf_page_count": len(reader.pages),
                "pdf_page_width_mm": round(width_mm, 3),
                "pdf_page_height_mm": round(height_mm, 3),
                "pdf_a3_size_matches": abs(width_mm - expected_width) < 0.1 and abs(height_mm - expected_height) < 0.1,
                "pdf_output_condition": str(output_intent.get("/OutputConditionIdentifier", "")),
                "pdf_fogra39": "FOGRA39" in str(output_intent.get("/OutputConditionIdentifier", "")),
                "pdf_cmyk_output_profile": destination_profile.get("/N") == 4 and default_cmyk_profile.get("/N") == 4,
                "pdf_embedded_fonts": font_resources_embedded(resources),
                "pdf_vector_only": len(page.images) == 0,
            })
        except Exception as error:
            checks["pdf_parse_error"] = str(error)
        try:
            with Image.open(webp) as image:
                image.load()
                decoded_pixels += image.width * image.height
                checks.update({
                    "webp_format": image.format,
                    "webp_width": image.width,
                    "webp_height": image.height,
                    "webp_dimensions_match": image.width == record["sirina_px"] and image.height == record["visina_px"],
                    "webp_rgb": image.mode in ("RGB", "RGBA"),
                    "webp_icc_profile_bytes": len(image.info.get("icc_profile", b"")),
                    "webp_has_srgb_profile": b"sRGB" in image.info.get("icc_profile", b"") and b"mntrRGB XYZ" in image.info.get("icc_profile", b""),
                })
        except Exception as error:
            checks["webp_decode_error"] = str(error)
        required = ("pdf_exists", "webp_exists", "pdf_hash_matches", "webp_hash_matches", "pdf_size_matches",
                    "webp_size_matches", "pixel_identity", "pdf_a3_size_matches", "pdf_fogra39", "pdf_cmyk_output_profile",
                    "pdf_embedded_fonts", "pdf_vector_only", "webp_dimensions_match", "webp_rgb", "webp_has_srgb_profile")
        passed = all(checks.get(name) is True for name in required)
        row = {
            "type": record["vrsta"], "year": record["leto"], "month": record["mesec"],
            "design_number": record["oblikovanje"], "design_name": record["ime_oblikovanja"],
            "pdf": record["pdf"], "webp": record["webp"], "passed": passed, "checks": checks,
        }
        rows.append(row)
        if not passed:
            failures.append({"pdf": record["pdf"], "webp": record["webp"], "failed_checks": [name for name in required if checks.get(name) is not True]})
        if index % 50 == 0:
            print(f"Original pairs {index}/780", flush=True)

    report = {
        "checked_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
        "collection_records": len(rows), "pdf_files": len(rows), "webp_files": len(rows),
        "decoded_webp_pixels": decoded_pixels, "failed_records": len(failures),
        "pixel_identity_records": sum(bool(row["checks"].get("pixel_identity")) for row in rows),
        "passed": not failures, "failures": failures, "records": rows,
    }
    output = ROOT / "evidence" / "calendar-collection-source-verification.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key not in ("records", "failures")}))
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
