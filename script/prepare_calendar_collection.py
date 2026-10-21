#!/usr/bin/env python3
"""Stage the verified A3 collection and retire the replaced gallery assets."""

from __future__ import annotations

import hashlib
import json
import shutil
import zipfile
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
DATA = ROOT / "data" / "calendar-collection"
ORIGINALS = DATA / "originals"
PREVIEWS = DATA / "previews"
BASE_URL = "/koledarji/2027-2030"
BASE_OUT = SITE / "koledarji" / "2027-2030"


def url_for(prefix: str, relative: str) -> str:
    return prefix.rstrip("/") + "/" + "/".join(quote(part, safe="-._~") for part in relative.split("/"))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def key(row: dict) -> tuple:
    options = row["options"]
    month = options.get("month") if options["type"] == "monthly" else None
    return (options["type"], options["year"], month, options["design"])


def main() -> None:
    if not SITE.is_dir():
        raise SystemExit("Static site output must exist before collection preparation.")
    shutil.rmtree(BASE_OUT, ignore_errors=True)
    seo = json.loads((DATA / "seo-podatki.json").read_text(encoding="utf-8"))
    qc = json.loads((DATA / "kontrola-kakovosti.json").read_text(encoding="utf-8"))
    previews = json.loads((DATA / "preview-manifest.json").read_text(encoding="utf-8"))
    catalog_path = SITE / "free" / "catalog.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    designs = json.loads((ROOT / "data/source/print-template-specification.json").read_text(encoding="utf-8"))["design_catalog"]
    if len(designs) != 15 or len(seo["datoteke"]) != 780 or len(qc["datoteke"]) != 780 or previews["source_records"] != 780:
        raise SystemExit("The collection, quality, design, or thumbnail manifests are incomplete.")
    if qc["napake_pri_koncni_kontroli"] != 0 or qc["opozorila_pri_koncni_kontroli"] != 0:
        raise SystemExit("The supplied collection quality gate contains errors or warnings.")

    design_ids = {ordinal: design["id"] for ordinal, design in enumerate(designs, 1)}
    legacy_rows = [row for row in catalog if row.get("options", {}).get("type") in ("monthly", "annual")
                and 2027 <= row["options"].get("year", 0) <= 2030
                and row["options"].get("paper") == "A4" and row["options"].get("orientation") == "portrait"
                and not row["options"].get("name") and not row["options"].get("notes") and not row["options"].get("entries")]
    prepared_rows = [row for row in catalog if row.get("collection") == "calendar-2027-2030"]
    already_prepared = False
    if len(legacy_rows) == 780 and not prepared_rows:
        old_rows = legacy_rows
    elif len(prepared_rows) == 780 and not legacy_rows:
        # The publication workflow starts from the last committed site snapshot,
        # which may already contain this collection. Reuse its stable catalog
        # rows and the committed legacy URL map so a clean rebuild is repeatable.
        old_rows = prepared_rows
        already_prepared = True
    else:
        raise SystemExit(f"Expected 780 legacy records or 780 prepared collection records; found {len(legacy_rows)}/{len(prepared_rows)}.")
    old_by_key = {key(row): row for row in old_rows}
    if len(old_by_key) != 780:
        raise SystemExit("The existing gallery records do not have unique period/design keys.")
    legacy_by_key = {}
    if already_prepared:
        prior_records = json.loads((ROOT / "evidence" / "calendar-collection-records.json").read_text(encoding="utf-8"))
        for prior in prior_records:
            prior_key = (prior["type"], prior["year"], prior["month"], prior["design"])
            legacy_by_key[prior_key] = prior
        if len(legacy_by_key) != 780:
            raise SystemExit("The committed collection report must preserve all 780 legacy URL mappings.")

    qc_by_pair = {(row["pdf"], row["webp"]): row for row in qc["datoteke"]}
    preview_by_source = {row["source"]: row for row in previews["previews"]}
    seo_by_pair = {(row["pdf"], row["webp"]): row for row in seo["datoteke"]}
    if len(qc_by_pair) != 780 or len(preview_by_source) != 780 or len(seo_by_pair) != 780:
        raise SystemExit("Collection manifest keys must be unique.")

    replacement_rows = []
    old_asset_urls = set()
    redirects = []
    map_rows = []
    for record in seo["datoteke"]:
        kind = "annual" if record["vrsta"] == "letni" else "monthly"
        month = record["mesec"]
        design = design_ids[record["oblikovanje"]]
        match_key = (kind, record["leto"], month, design)
        old = old_by_key.get(match_key)
        if old is None:
            raise SystemExit(f"Missing old catalogue match: {match_key}.")
        qrow = qc_by_pair[(record["pdf"], record["webp"])]
        if not qrow["ujemanje_vseh_pikslov"]:
            raise SystemExit(f"Pixel-identity gate failed: {record['webp']}.")
        source_pdf = ORIGINALS / record["pdf"]
        source_webp = ORIGINALS / record["webp"]
        thumb_record = preview_by_source[record["webp"]]
        source_preview = DATA / thumb_record["preview"]
        for source, expected, label in (
            (source_pdf, qrow["pdf_sha256"], "PDF"),
            (source_webp, qrow["webp_sha256"], "WebP"),
            (source_preview, thumb_record["sha256"], "preview"),
        ):
            if not source.is_file() or sha256(source) != expected:
                raise SystemExit(f"{label} bytes do not match the checked source: {source}.")
        width = int(record["sirina_px"])
        height = int(record["visina_px"])
        orientation = "landscape" if width > height else "portrait"
        fingerprint = old["fingerprint"] if already_prepared else hashlib.sha256(
            ("koledar365-collection-v1\0" + old["fingerprint"] + "\0"
             + qrow["pdf_sha256"] + "\0" + qrow["webp_sha256"]).encode("utf-8")
        ).hexdigest()
        expected_pdf_url = url_for(BASE_URL + "/original", record["pdf"])
        expected_webp_url = url_for(BASE_URL + "/original", record["webp"])
        expected_preview_url = url_for(BASE_URL + "/preview", record["webp"])
        pdf_url = old["files"]["pdf"] if already_prepared else expected_pdf_url
        webp_url = old["files"]["webp"] if already_prepared else expected_webp_url
        preview_url = old["files"]["preview"] if already_prepared else expected_preview_url
        if (pdf_url, webp_url, preview_url) != (expected_pdf_url, expected_webp_url, expected_preview_url):
            raise SystemExit(f"Prepared catalogue paths changed unexpectedly for {record['pdf']}.")
        output_pdf = SITE / pdf_url.lstrip("/")
        output_webp = SITE / webp_url.lstrip("/")
        output_preview = SITE / preview_url.lstrip("/")
        for source, target in ((source_pdf, output_pdf), (source_webp, output_webp), (source_preview, output_preview)):
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
        if sha256(output_pdf) != qrow["pdf_sha256"] or sha256(output_webp) != qrow["webp_sha256"]:
            raise SystemExit(f"Staged originals differ from source bytes: {record['pdf']}.")

        prior = legacy_by_key.get(match_key, {})
        old_pdf = prior["old_pdf_url"] if already_prepared else old["files"]["pdf"]
        old_webp = prior["old_webp_url"] if already_prepared else old["files"]["webp"]
        old_preview = old_pdf.rsplit("/", 1)[0] + "/predogled.webp" if already_prepared else old["files"]["preview"]
        old_asset_urls.update((old_pdf, old_webp, old_preview))
        legacy_webp_url = webp_url
        legacy_zip_url = old.get("legacy_webp_url") if already_prepared else None
        if old_webp.endswith(".zip"):
            if not legacy_zip_url:
                zip_name = fingerprint + ".zip"
                legacy_zip_url = url_for(BASE_URL + "/compatibility", zip_name)
            zip_path = SITE / legacy_zip_url.lstrip("/")
            zip_path.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as archive:
                item = zipfile.ZipInfo(Path(record["webp"]).name, date_time=(1980, 1, 1, 0, 0, 0))
                item.compress_type = zipfile.ZIP_STORED
                item.external_attr = 0o100644 << 16
                with source_webp.open("rb") as source, archive.open(item, "w") as target:
                    shutil.copyfileobj(source, target, length=1024 * 1024)
                manifest_info = zipfile.ZipInfo("manifest.json", date_time=(1980, 1, 1, 0, 0, 0))
                manifest_info.compress_type = zipfile.ZIP_STORED
                archive.writestr(manifest_info, json.dumps({"format": "WebP", "files": [Path(record["webp"]).name]}, separators=(",", ":")))
            legacy_webp_url = legacy_zip_url

        for old_url, new_url, label in ((old_pdf, pdf_url, "pdf"), (old_webp, legacy_webp_url, "webp")):
            redirects.append({"from": old_url, "to": new_url, "status": 301, "format": label})
        pages = [{
            "page_index": 1,
            "filename": Path(record["webp"]).name,
            "sha256": qrow["webp_sha256"],
            "width_px": width,
            "height_px": height,
            "width_mm": 420 if orientation == "landscape" else 297,
            "height_mm": 297 if orientation == "landscape" else 420,
            "nominal_ppi": 600,
            "color_mode": designs[record["oblikovanje"] - 1]["color_mode"],
        }]
        new_options = dict(old["options"])
        new_options["paper"] = "A3"
        new_options["orientation"] = orientation
        manifest = dict(old["manifest"])
        manifest.update({
            "pages": pages,
            "pdf_filename": Path(record["pdf"]).name,
            "pdf_sha256": qrow["pdf_sha256"],
            "page_count": 1,
            "source_data_version": old["manifest"]["source_data_version"],
            "template_version": old["manifest"]["template_version"],
            "width_px": width,
            "height_px": height,
            "ppi": 600,
            "brand": "Koledar365 · koledar365.si",
            "source_collection": "koledar365 2027–2030",
            "webp_sha256": qrow["webp_sha256"],
        })
        new_row = {
            "options": new_options,
            "fingerprint": fingerprint,
            "page_count": 1,
            "manifest": manifest,
            "files": {"pdf": pdf_url, "webp": webp_url, "preview": preview_url},
            "collection": "calendar-2027-2030",
            "collection_seo": {"title": record["naslov"], "alt": record["alt"], "design_name": record["ime_oblikovanja"]},
            "preview_width": thumb_record["width"],
            "preview_height": thumb_record["height"],
            "source": {"pdf": record["pdf"], "webp": record["webp"]},
            "source_hashes": {"pdf": qrow["pdf_sha256"], "webp": qrow["webp_sha256"]},
            "legacy_webp_url": legacy_zip_url,
            "color_mode": "color",
        }
        replacement_rows.append(new_row)
        map_rows.append({
            "type": kind, "year": record["leto"], "month": month,
            "design_number": record["oblikovanje"], "design": design,
            "title": record["naslov"], "alt": record["alt"],
            "source_pdf": record["pdf"], "source_webp": record["webp"],
            "pdf_sha256": qrow["pdf_sha256"], "webp_sha256": qrow["webp_sha256"],
            "pdf_bytes": source_pdf.stat().st_size, "webp_bytes": source_webp.stat().st_size,
            "pdf_url": pdf_url, "webp_url": webp_url, "preview_url": preview_url,
            "preview_width": thumb_record["width"], "preview_height": thumb_record["height"],
            "old_pdf_url": old_pdf, "old_webp_url": old_webp,
            "compatibility_zip_url": legacy_zip_url,
        })

    replacement_keys = {key(row) for row in replacement_rows}
    if len(replacement_keys) != 780 or len({row["fingerprint"] for row in replacement_rows}) != 780:
        raise SystemExit("Replacement collection records are not unique.")
    remaining = [row for row in catalog if row not in old_rows]
    updated_catalog = sorted(remaining + replacement_rows,
                             key=lambda row: (row["options"]["type"], row["options"]["year"],
                                              row["options"].get("month", 0), row["options"]["design"], row["fingerprint"]))
    if len(updated_catalog) != len(catalog) or len({row["fingerprint"] for row in updated_catalog}) != len(updated_catalog):
        raise SystemExit("The replacement must preserve the number of distinct catalogue records.")

    redirect_path = SITE / "_redirects"
    existing_lines = redirect_path.read_text(encoding="utf-8").splitlines() if redirect_path.exists() else []
    existing = {}
    for line in existing_lines:
        parts = line.split()
        if len(parts) >= 3 and not parts[0].startswith("#"):
            existing[parts[0]] = (parts[1], parts[2])
    for redirect in redirects:
        prior = existing.get(redirect["from"])
        if prior and prior != (redirect["to"], "301"):
            raise SystemExit(f"Conflicting existing redirect for {redirect['from']}.")
        existing[redirect["from"]] = (redirect["to"], "301")
    if len(existing) > 2000:
        raise SystemExit(f"Cloudflare Pages redirect limit exceeded: {len(existing)}.")
    for source, (destination, status) in existing.items():
        if source == destination:
            raise SystemExit(f"Redirect loop detected at {source}.")
    redirect_lines = [line for line in existing_lines if line.strip().startswith("#") or not line.strip()]
    redirect_lines += [f"{source} {destination} {status}" for source, (destination, status) in sorted(existing.items())]

    referenced_after = {value for row in remaining for value in row.get("files", {}).values()}
    removed_files = []
    for old_url in sorted(old_asset_urls - referenced_after):
        path = SITE / old_url.lstrip("/")
        if path.is_file():
            removed_files.append({"url": old_url, "bytes": path.stat().st_size, "sha256": sha256(path)})
            path.unlink()
    for directory in sorted({(SITE / url.lstrip("/")).parent for url in old_asset_urls}, key=lambda item: len(item.parts), reverse=True):
        current = directory
        while current != SITE and current.exists():
            try:
                current.rmdir()
            except OSError:
                break
            current = current.parent

    catalog_path.write_text(json.dumps(updated_catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    redirect_path.write_text("\n".join(redirect_lines) + "\n", encoding="utf-8")
    evidence = ROOT / "evidence"
    evidence.mkdir(exist_ok=True)
    (evidence / "calendar-collection-records.json").write_text(json.dumps(map_rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (evidence / "calendar-collection-records.csv").write_text(
        "type,year,month,design_number,design,title,alt,source_pdf,source_webp,pdf_sha256,webp_sha256,pdf_bytes,webp_bytes,pdf_url,webp_url,preview_url,preview_width,preview_height,old_pdf_url,old_webp_url,compatibility_zip_url\n" +
        "".join(",".join('"' + str(row.get(field, "")).replace('"', '""') + '"' for field in (
            "type", "year", "month", "design_number", "design", "title", "alt", "source_pdf", "source_webp",
            "pdf_sha256", "webp_sha256", "pdf_bytes", "webp_bytes", "pdf_url", "webp_url", "preview_url",
            "preview_width", "preview_height", "old_pdf_url", "old_webp_url", "compatibility_zip_url")) + "\n" for row in map_rows),
        encoding="utf-8")
    backup_manifest = json.loads((evidence / "calendar-collection-backup-manifest.json").read_text(encoding="utf-8"))
    previous_removals = []
    report_path = evidence / "calendar-collection-redirects.json"
    if report_path.is_file():
        previous_removals = json.loads(report_path.read_text(encoding="utf-8")).get("removed_files", [])
    removal_report = removed_files or previous_removals
    (report_path).write_text(json.dumps({
        "count": len(redirects), "redirects": redirects, "removed_files": removal_report,
        "backup_archive": "../backups/koledar-2027-2030-before-e053917b0ca5.tar.gz (local workspace)",
        "backup_manifest": "evidence/calendar-collection-backup-manifest.json",
        "backup_commit": backup_manifest["source_commit"],
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "collection_records": len(replacement_rows), "catalog_records": len(updated_catalog),
        "redirects": len(redirects), "redirect_rules_total": len(existing),
        "old_files_removed": len(removal_report), "old_bytes_removed": sum(row["bytes"] for row in removal_report),
        "new_originals_bytes": sum(row["pdf_bytes"] + row["webp_bytes"] for row in map_rows),
    }))


if __name__ == "__main__":
    main()
