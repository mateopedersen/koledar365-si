#!/usr/bin/env bash
# Run after rebuild_free.rb. Every command is a release gate, not a score.
set -euo pipefail
task_python="${PYTHON_BIN:-python3}"
"$task_python" test/test_cdn_email_parity.py
"$task_python" script/test_horoscope_parity.py
"$task_python" script/qa_seo.py
bundle exec ruby script/audit_numeric_dates.rb
"$task_python" script/audit_calendar_independent.py
node script/test_advertising.mjs
node script/test_advertising_csp.mjs
node script/test_advertising_runtime.mjs
node script/test_qa_image_loading.mjs
task_port="${K365_QA_PORT:-19783}"
export K365_BASE_URL="http://127.0.0.1:$task_port"
task_log="${TMPDIR:-/tmp}/k365-qa-server-$$.log"
K365_STATIC_PORT="$task_port" "$task_python" script/serve_static.py > "$task_log" 2>&1 &
task_server_pid=$!
trap 'kill "$task_server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 30); do
  if ! kill -0 "$task_server_pid" 2>/dev/null; then cat "$task_log" >&2; exit 1; fi
  if curl --silent --fail "$K365_BASE_URL/robots.txt" > /dev/null; then break; fi
  sleep 1
done
curl --silent --fail "$K365_BASE_URL/robots.txt" > /dev/null
# A previously running server must never make another checkout pass this gate.
"$task_python" - <<'PY'
import os
from pathlib import Path
from urllib.request import urlopen
with urlopen(os.environ["K365_BASE_URL"]+"/release-manifest.json",timeout=10) as response:
    assert response.read()==Path("site/release-manifest.json").read_bytes(), "QA server is serving a different publication"
PY
kill -0 "$task_server_pid" 2>/dev/null || { cat "$task_log" >&2; exit 1; }
# Fail fast on the calendar regression before the longer site-wide scans.
pnpm exec playwright test test/browser/calendar-event-labels.spec.mjs
# Exercise cold-runtime tab readiness before the longer matrix.
pnpm exec playwright test test/browser/seo-interactions.spec.mjs --grep "date calculator tabs"
# Exercise the responsive controls and isolated worker recovery before the broad scans.
pnpm exec playwright test test/browser/city-card.spec.mjs test/browser/global-layout.spec.mjs test/browser/responsive-layout.spec.mjs test/browser/select-controls.spec.mjs test/browser/studio-loading-layout.spec.mjs --grep 'weather emoji animate|date statistics|month chips|controls at (320|360)px|dropdown indicator at (320|360)px|studio tool names|phone shortcuts|important-day filters'
pnpm exec playwright test test/browser/control-consistency.spec.mjs --grep 'shared controls have consistent'
pnpm exec playwright test test/browser/ruby-runtime-recovery.spec.mjs --project=webkit --project=iphone-webkit --workers=1
# Catch cookie migration overlaps before the long site-wide matrix.
pnpm exec playwright test test/browser/consent-bar.spec.mjs test/browser/education.spec.mjs test/browser/garden-payments.spec.mjs --grep "cookie consent appears|school timetable keeps|payment coverage ends"
QA_WORKERS=1 node script/qa_browser.mjs
QA_OUT=evidence/qa/css-layout node script/qa_css_layout.mjs
QA_WORKERS=1 QA_MODE=a11y node script/qa_browser.mjs
QA_WORKERS=1 QA_BROWSER=webkit QA_SAMPLE_ONLY=1 node script/qa_browser.mjs
bash script/verify_release_tail.sh
