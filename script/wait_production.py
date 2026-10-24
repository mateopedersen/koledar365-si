#!/usr/bin/env python3
"""Wait until Cloudflare serves the expected generated publication."""
import json
import os
import time
from pathlib import Path
from urllib.request import Request, urlopen

checked_in_manifest = json.loads(Path("site/release-manifest.json").read_text())
# The generated artifact records its source revision. A merge or publication
# commit may legitimately differ from that revision, including on push events.
# Fresh CI rebuilds also write their expected revision into this same manifest.
expected = checked_in_manifest.get("source_commit") or os.environ.get("GITHUB_SHA")
if not expected:
    raise SystemExit("No expected publication source commit is available.")

for attempt in range(40):
    url = f"https://koledar365.si/release-manifest.json?publication-check={expected}-{attempt}"
    try:
        request = Request(
            url,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "identity",
                "Cache-Control": "no-cache",
                "Pragma": "no-cache",
                "User-Agent": "Koledar365-Release-Parity/1.0",
            },
        )
        with urlopen(request, timeout=30) as response:
            manifest = json.load(response)
        published = manifest.get("source_commit")
        if published == expected:
            print(
                "Cloudflare is serving the publication for "
                f"{published} (built at {manifest.get('built_at', 'unknown')})."
            )
            break
        print(
            f"Waiting for publication: {attempt + 1}/40 "
            f"(currently serving {published or 'an unknown source commit'})",
            flush=True,
        )
    except Exception as error:
        print(f"{type(error).__name__}: {error}", flush=True)
        print(f"Waiting for publication: {attempt + 1}/40", flush=True)
    if attempt < 39:
        time.sleep(30)
else:
    raise SystemExit("Cloudflare did not serve this publication within 20 minutes.")
