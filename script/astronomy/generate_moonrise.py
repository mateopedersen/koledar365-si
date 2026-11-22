#!/usr/bin/env python3
"""Build local civil day moonrise and moonset tables with Astronomy Engine."""
import json
from datetime import date, datetime, time, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

from astronomy import Body, Direction, Illumination, Observer, SearchRiseSet, Time

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "public/calendar-tools/moonrise"
FIRST, LAST = date(2026, 1, 1), date(2030, 12, 31)
ZONE = ZoneInfo("Europe/Ljubljana")


def lunar_crossing(observer, start, end, direction):
    event = SearchRiseSet(
        Body.Moon, observer, direction, Time.Parse(start.isoformat().replace("+00:00", "Z")),
        (end - start).total_seconds() / 86400,
    )
    if event is None:
        return None
    instant = event.Utc().replace(tzinfo=timezone.utc)
    if not start <= instant < end:
        return None
    rounded = (instant + timedelta(seconds=30)).replace(second=0, microsecond=0)
    return min(rounded, end - timedelta(minutes=1)).isoformat(timespec="minutes")


def city_days(city):
    # Reference horizon at sea level, consistent with the site astronomy datasets.
    observer = Observer(city["latitude"], city["longitude"], 0)
    days = []
    for offset in range((LAST - FIRST).days + 1):
        day = FIRST + timedelta(days=offset)
        start = datetime.combine(day, time.min, ZONE).astimezone(timezone.utc)
        end = datetime.combine(day + timedelta(days=1), time.min, ZONE).astimezone(timezone.utc)
        noon = datetime.combine(day, time(12), ZONE).astimezone(timezone.utc)
        light = Illumination(Body.Moon, Time.Parse(noon.isoformat().replace("+00:00", "Z")))
        days.append([lunar_crossing(observer, start, end, Direction.Rise), lunar_crossing(observer, start, end, Direction.Set),
                     round(light.phase_fraction * 100)])
    return days


def main():
    cities = json.loads((ROOT / "data/astronomy/events-2026-2030.json").read_text())["cities"]
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for city in cities:
        data = {"first": FIRST.isoformat(), "days": city_days(city)}
        (OUTPUT / f"{city['id']}.json").write_text(json.dumps(data, separators=(",", ":")) + "\n")
        print(f"{city['name']}: {len(data['days'])} days", flush=True)


if __name__ == "__main__":
    main()
