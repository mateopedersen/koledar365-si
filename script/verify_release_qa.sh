#!/usr/bin/env bash
# Run after rebuild_free.rb. Every command is a release gate, not a score.
set -euo pipefail
task_python="${PYTHON_BIN:-python3}"
"$task_python" test/test_cdn_email_parity.py
"$task_python" script/test_horoscope_parity.py
"$task_python" script/qa_seo.py
"$task_python" script/audit_calendar_independent.py
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
node script/qa_browser.mjs
QA_OUT=evidence/qa/css-layout node script/qa_css_layout.mjs
QA_MODE=a11y node script/qa_browser.mjs
QA_BROWSER=webkit QA_SAMPLE_ONLY=1 node script/qa_browser.mjs
QA_BROWSER=firefox QA_SAMPLE_ONLY=1 node script/qa_browser.mjs
node script/qa_keyboard.mjs
node script/qa_exports.mjs
"$task_python" script/qa_export_files.py
pnpm exec playwright test
"$task_python" script/qa_downloads.py
"$task_python" script/qa_collection_raster.py
