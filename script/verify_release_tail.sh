#!/usr/bin/env bash
# Remaining gates also support a verified continuation after a QA-only repair.
set -euo pipefail
task_python="${PYTHON_BIN:-python3}"
QA_WORKERS=1 QA_BROWSER=firefox QA_SAMPLE_ONLY=1 node script/qa_browser.mjs
node script/qa_keyboard.mjs
node script/qa_exports.mjs
"$task_python" script/qa_export_files.py
pnpm exec playwright test
"$task_python" script/qa_downloads.py
"$task_python" script/qa_collection_raster.py
