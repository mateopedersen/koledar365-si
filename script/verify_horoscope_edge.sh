#!/usr/bin/env bash
set -euo pipefail
fixture_dir=$(mktemp -d "${TMPDIR:-/tmp}/koledar-horoscope-edge.XXXXXX")
edge_pid=''
cleanup() {
  if [ -n "$edge_pid" ]; then kill "$edge_pid" 2>/dev/null || true; wait "$edge_pid" 2>/dev/null || true; fi
  rm -rf "$fixture_dir"
}
trap cleanup EXIT
python3 - "$fixture_dir" <<'PY'
import pathlib, re, sys
source = pathlib.Path('site/horoskop')
target = pathlib.Path(sys.argv[1]) / 'horoskop'
files = list(source.rglob('*.html'))
assert len(files) >= 14, 'Complete built horoscope pages required'
for source_file in files:
    content = source_file.read_text()
    content = re.sub(r'data-edition-day="[^"]*"', 'data-edition-day="2000-01-01"', content)
    content = re.sub(r'(<([a-zA-Z0-9]+)\b[^>]*data-reading-field="[^"]+"[^>]*>).*?(</\2>)', r'\1STARI ZAPIS\3', content, flags=re.S)
    destination = target / source_file.relative_to(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(content)
assert 'STARI ZAPIS' in (target / 'dvojcka/index.html').read_text()
print('Prepared 14-route real HTML fixtures with deliberately stale readings')
PY
# Run the repository's actual Pages Functions in workerd against stale assets.
pnpm exec wrangler pages dev "$fixture_dir" --ip 127.0.0.1 --port 8799 >"$fixture_dir/worker.log" 2>&1 &
edge_pid=$!
for attempt in $(seq 1 45); do
  if curl --silent --fail http://127.0.0.1:8799/horoskop/dnevno.json >/dev/null; then break; fi
  if ! kill -0 "$edge_pid" 2>/dev/null; then cat "$fixture_dir/worker.log"; exit 1; fi
  sleep 1
done
HOROSCOPE_ORIGIN=http://127.0.0.1:8799 node script/test_horoscope_edge.mjs
