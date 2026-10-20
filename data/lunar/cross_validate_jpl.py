#!/usr/bin/env python3
"""Independently compare every local-noon row with Skyfield + NASA/JPL DE440s.

No Astronomy Engine code is imported. This script never changes calendar data.
Install requirements-jpl.txt, then pass --ephemeris /path/to/de440s.bsp.
Use --download to fetch the public kernel into that path if it is missing.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo, reset_tzpath

import numpy as np
import tzdata
from skyfield.api import load, load_file
from skyfield.framelib import ecliptic_frame

BASE = Path(__file__).resolve().parent
KERNEL_URL = "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp"
KERNEL_SHA256 = "c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"
VERIFIED_ON = "2026-10-20"
# Gates are declared before the comparison and are not relaxed to fit results.
ILLUMINATION_TOLERANCE_PP = 0.05
LONGITUDE_TOLERANCE_DEG = 0.02


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        while chunk := handle.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def download_kernel(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".download")
    request = Request(KERNEL_URL, headers={"User-Agent": "Koledar365-Independent-Validation/1.0"})
    with urlopen(request, timeout=45) as source, temporary.open("wb") as destination:
        while chunk := source.read(1024 * 1024):
            destination.write(chunk)
    actual = sha256(temporary)
    if actual != KERNEL_SHA256:
        temporary.unlink()
        raise RuntimeError("Downloaded kernel SHA-256 differs from the audited kernel; inspect the source before updating the pin.")
    temporary.replace(path)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ephemeris", type=Path, required=True)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    if not args.ephemeris.exists():
        if not args.download:
            raise FileNotFoundError("Provide the public de440s.bsp kernel or explicitly add --download.")
        download_kernel(args.ephemeris)
    kernel_hash = sha256(args.ephemeris)
    assert kernel_hash == KERNEL_SHA256, "Ephemeris hash mismatch"

    versions = {name: importlib.metadata.version(name) for name in ["skyfield", "jplephem", "sgp4", "numpy", "certifi", "tzdata"]}
    assert versions == {"skyfield": "1.55", "jplephem": "2.24", "sgp4": "2.27", "numpy": "2.5.4", "certifi": "2026.10.19", "tzdata": "2026.5"}, versions
    reset_tzpath([str(Path(tzdata.__file__).resolve().parent / "zoneinfo")])
    ZoneInfo.clear_cache()
    local_zone = ZoneInfo("Europe/Ljubljana")

    daily_path = BASE / "lunar-daily-2027-2030.json"
    data = json.loads(daily_path.read_text(encoding="utf-8"))
    rows = data["days"]
    assert len(rows) == 1461
    dates = []
    utc_instants = []
    for index, row in enumerate(rows):
        day = date(2027, 1, 1) + timedelta(days=index)
        assert row["date"] == day.isoformat()
        local_noon = datetime.combine(day, time(12), tzinfo=local_zone)
        utc = local_noon.astimezone(timezone.utc)
        assert utc.isoformat(timespec="seconds").replace("+00:00", "Z") == row["utc"]
        assert local_noon.isoformat(timespec="seconds") == row["localNoon"]
        dates.append(day.isoformat())
        utc_instants.append(utc)
    assert dates[-1] == "2030-12-31"

    # Use Skyfield's bundled time tables so reproduction makes no hidden
    # network request for IERS data. Future leap-second announcements can
    # require a deliberate revalidation with an updated package.
    ts = load.timescale(builtin=True)
    instants = ts.from_datetimes(utc_instants)
    ephemeris = load_file(str(args.ephemeris))
    earth, moon, sun = ephemeris["earth"], ephemeris["moon"], ephemeris["sun"]
    geocenter = earth.at(instants)
    apparent_moon = geocenter.observe(moon).apparent()
    apparent_sun = geocenter.observe(sun).apparent()
    fractions = apparent_moon.fraction_illuminated(sun)
    _, moon_longitude, _ = apparent_moon.frame_latlon(ecliptic_frame)
    _, sun_longitude, _ = apparent_sun.frame_latlon(ecliptic_frame)
    longitudes = (moon_longitude.degrees - sun_longitude.degrees) % 360.0

    source_fractions = np.array([row["illuminationFraction"] for row in rows])
    source_longitudes = np.array([row["moonSunLongitudeDeg"] for row in rows])
    deltas_pp = np.abs(fractions - source_fractions) * 100.0
    longitude_deltas = np.abs((longitudes - source_longitudes + 180.0) % 360.0 - 180.0)
    waxing = longitudes < 180.0
    mismatches = [dates[i] for i, row in enumerate(rows) if bool(waxing[i]) != row["waxing"]]
    assert np.all(np.isfinite(fractions)) and np.all((fractions >= 0.0) & (fractions <= 1.0))
    assert float(np.max(deltas_pp)) <= ILLUMINATION_TOLERANCE_PP
    assert float(np.max(longitude_deltas)) <= LONGITUDE_TOLERANCE_DEG
    assert not mismatches, f"Waxing/waning mismatches: {mismatches}"

    # Half-up at one decimal percentage point, matching normal display
    # rounding for positive numbers; close-to-boundary differences are
    # reported openly instead of being hidden by the overall tolerance.
    source_tenths = np.floor(source_fractions * 1000.0 + 0.5).astype(int)
    jpl_tenths = np.floor(fractions * 1000.0 + 0.5).astype(int)
    rounding_differences = []
    for i in np.flatnonzero(source_tenths != jpl_tenths):
        rounding_differences.append({
            "date": dates[i],
            "astronomyEngineDisplayPercent": float(source_tenths[i] / 10.0),
            "skyfieldJplDisplayPercent": float(jpl_tenths[i] / 10.0),
            "absoluteDifferencePercentagePoints": round(float(deltas_pp[i]), 9),
        })
    comparisons = []
    for i, row in enumerate(rows):
        comparisons.append({
            "date": dates[i], "utc": row["utc"],
            "astronomyEngineFraction": row["illuminationFraction"],
            "skyfieldJplFraction": round(float(fractions[i]), 10),
            "absoluteDifferencePercentagePoints": round(float(deltas_pp[i]), 9),
            "skyfieldMoonSunLongitudeDeg": round(float(longitudes[i]), 8),
            "longitudeDifferenceDeg": round(float(longitude_deltas[i]), 9),
            "waxingMatches": bool(waxing[i]) == row["waxing"],
        })
    report = {
        "status": "passed", "verifiedOn": VERIFIED_ON,
        "independentImplementation": "Skyfield + jplephem + NASA/JPL DE440s; no Astronomy Engine import",
        "versions": versions,
        "ianaTzdbVersion": tzdata.IANA_VERSION,
        "inputFile": daily_path.name,
        "inputSha256": sha256(daily_path),
        "kernel": {"name": "de440s.bsp", "url": KERNEL_URL, "sha256": kernel_hash, "sizeBytes": args.ephemeris.stat().st_size},
        "sampleConvention": "Each date at 12:00:00 Europe/Ljubljana, converted to UTC; geocentric apparent Moon",
        "illuminationMethod": "earth.at(t).observe(moon).apparent().fraction_illuminated(sun)",
        "phaseMethod": "difference of apparent Moon and Sun ecliptic longitudes in skyfield.framelib.ecliptic_frame, modulo 360 degrees",
        "skyfieldTimescale": {"builtin": True, "lastBundledLeapSecondJulianDate": float(ts.leap_dates[-1]), "lastBundledTaiMinusUtcSeconds": float(ts.leap_offsets[-1])},
        "daysChecked": len(rows),
        "illuminationTolerancePercentagePoints": ILLUMINATION_TOLERANCE_PP,
        "maximumIlluminationDifferencePercentagePoints": round(float(np.max(deltas_pp)), 9),
        "maximumIlluminationDifferenceDate": dates[int(np.argmax(deltas_pp))],
        "meanIlluminationDifferencePercentagePoints": round(float(np.mean(deltas_pp)), 9),
        "longitudeToleranceDegrees": LONGITUDE_TOLERANCE_DEG,
        "maximumLongitudeDifferenceDegrees": round(float(np.max(longitude_deltas)), 9),
        "waxingWaningMatches": len(rows) - len(mismatches),
        "oneDecimalPercentRoundingDifferenceCount": len(rounding_differences),
        "oneDecimalPercentRoundingDifferences": rounding_differences,
        "limitations": [
            "This cross-check verifies geometric illuminated fraction and the waxing/waning phase direction, not a photographed appearance.",
            "Geocentric values are evaluated at Slovenian civil noon; topocentric horizon orientation, lunar surface libration, crater relief, atmospheric extinction, and eclipse shadowing are not validated.",
            "The independent pipelines have different orbital models, apparent-position corrections, and time-scale approximations, so tiny numeric differences and one-decimal rounding-boundary differences are reported rather than called exact agreement.",
            "The original 17 USNO noon samples are whole-percent values; alone they do not validate tenths of a percentage point.",
            "Skyfield's bundled leap-second table contains only announced leap seconds. Revalidate after future leap-second or timezone-rule changes.",
        ],
        "sources": [
            "https://rhodesmill.org/skyfield/examples.html#what-phase-is-the-moon-tonight",
            "https://rhodesmill.org/skyfield/api-position.html",
            "https://ssd.jpl.nasa.gov/doc/de440_de441.html",
            KERNEL_URL,
        ],
        "comparisons": comparisons,
    }
    output = BASE / "independent-validation-jpl.json"
    output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    ephemeris.close()
    print(json.dumps({key: report[key] for key in ["status", "daysChecked", "maximumIlluminationDifferencePercentagePoints", "maximumLongitudeDifferenceDegrees", "waxingWaningMatches", "oneDecimalPercentRoundingDifferenceCount"]}, indent=2))


if __name__ == "__main__":
    main()
