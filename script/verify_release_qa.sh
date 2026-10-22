#!/usr/bin/env bash
# Run after rebuild_free.rb. Every command is a release gate, not a score.
set -euo pipefail
task_python="${PYTHON_BIN:-python3}"
"$task_python" test/test_cdn_email_parity.py
"$task_python" script/qa_seo.py
export K365_BASE_URL=http://127.0.0.1:19783
K365_STATIC_PORT=19783 "$task_python" script/serve_static.py > /tmp/k365-qa-server.log 2>&1 &
task_server_pid=$!
trap 'kill "$task_server_pid" 2>/dev/null || true' EXIT
for attempt in $(seq 1 30); do
  if curl --silent --fail "$K365_BASE_URL/robots.txt" > /dev/null; then break; fi
  sleep 1
done
curl --silent --fail "$K365_BASE_URL/robots.txt" > /dev/null
node script/qa_browser.mjs
QA_MODE=a11y node script/qa_browser.mjs
QA_BROWSER=webkit QA_SAMPLE_ONLY=1 node script/qa_browser.mjs
node script/qa_keyboard.mjs
node script/qa_exports.mjs
"$task_python" script/qa_export_files.py
pnpm exec playwright test
"$task_python" script/qa_downloads.py
"$task_python" script/qa_collection_raster.py
