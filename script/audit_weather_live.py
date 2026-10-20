"""Check every public city forecast and compare a sample with MET Norway itself."""
import argparse
import concurrent.futures
import datetime as dt
import json
import math
from pathlib import Path
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
HEADERS = {"User-Agent": "Koledar365 weather QA/1.0 (+https://koledar365.si/kontakt/)"}


def read(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=20) as response:
        return json.load(response)


def stamp(value):
    return dt.datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="https://koledar365.si")
    args = parser.parse_args()
    cities = json.loads((ROOT / "data/cities_sl.json").read_text())["cities"]
    now = dt.datetime.now(dt.timezone.utc).timestamp()

    def check(city):
        try:
            body = read(args.base_url.rstrip("/") + "/vreme/" + city["id"] + "/")
            current = body["current"]
            passed = (body["city"] == city["id"] and math.isfinite(current["temperature"])
                      and abs(now - stamp(current["at"])) < 7200
                      and -300 <= now - stamp(body["updated_at"]) < 43200
                      and isinstance(current["symbol"], str))
            return {"city": city["id"], "passed": passed, "current": current,
                    "updated_at": body["updated_at"], "stale": body["stale"]}
        except Exception as error:
            return {"city": city["id"], "passed": False, "error": str(error)}

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, cities))
    samples = []
    for city in cities:
        if city["id"] not in {"domzale", "bled", "bovec", "koper", "maribor"}:
            continue
        try:
            point = city["coordinates"][0]
            url = ("https://api.met.no/weatherapi/locationforecast/2.0/compact"
                   f"?lat={point['lat']:.4f}&lon={point['lon']:.4f}")
            model = read(url)["properties"]
            live = next(row for row in results if row["city"] == city["id"])
            row = next(row for row in model["timeseries"] if row["time"] == live["current"]["at"])
            details = row["data"]
            symbol = (details.get("next_1_hours") or details.get("next_6_hours"))["summary"]["symbol_code"]
            passed = (details["instant"]["details"]["air_temperature"] == live["current"]["temperature"]
                      and symbol == live["current"]["symbol"])
            samples.append({"city": city["id"], "passed": passed, "symbol": symbol,
                            "temperature": details["instant"]["details"]["air_temperature"],
                            "coordinates": point, "source_updated_at": model["meta"]["updated_at"],
                            "same_model": stamp(model["meta"]["updated_at"]) == stamp(live["updated_at"])})
        except Exception as error:
            samples.append({"city": city["id"], "passed": False, "error": str(error)})
    report = {"checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
              "base_url": args.base_url, "passed": all(r["passed"] for r in results + samples),
              "city_count": len(results), "direct_source_count": len(samples),
              "cities": results, "direct_source_comparisons": samples}
    destination = ROOT / "evidence/weather-city-source-audit.json"
    destination.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({key: report[key] for key in ["checked_at", "passed", "city_count", "direct_source_count"]}))
    if not report["passed"]:
        print(json.dumps([r for r in results + samples if not r["passed"]], ensure_ascii=False))
        raise SystemExit(1)


if __name__ == "__main__":
    main()
