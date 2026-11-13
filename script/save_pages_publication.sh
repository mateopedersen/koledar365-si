#!/usr/bin/env bash
# Run only in the disposable publication CI checkout, after release verification.
set -euo pipefail
git config user.name 'Koledar365 publication'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
commit_publication() {
  git add site evidence/indexability-audit.json functions/cities.js public/horoscope/daily.json data/editorial/horoscopes.json data/editorial/pages.json docs/advanced-calendar-live-urls.txt
  if git diff --cached --quiet; then exit 0; fi
  git commit -m 'Publish verified calendar and dated editorial content'
}

source_revision=$(git rev-parse HEAD)
commit_publication
for attempt in 1 2 3; do
  if git push origin HEAD:main; then exit 0; fi
  if [ "$attempt" = 3 ]; then exit 1; fi
  git fetch origin main
  latest_revision=$(git rev-parse FETCH_HEAD)
  if [ "$latest_revision" = "$source_revision" ]; then continue; fi

  # Test-only commits can arrive during the two-hour browser gate. Keep the
  # exact verified output and rerun the Rails suite against the new assertions.
  # Record those newly verified test fingerprints without rewriting runtime
  # fingerprints or claiming the output was built from a different revision.
  if git merge-base --is-ancestor "$source_revision" "$latest_revision" &&
     git diff --quiet "$source_revision" "$latest_revision" -- . ':(exclude,glob)test/**/*_test.rb'; then
    verified_publication=$(git rev-parse HEAD)
    git reset --hard "$latest_revision"
    git cherry-pick "$verified_publication"
    RAILS_ENV=test bundle exec rails db:prepare
    RAILS_ENV=test bundle exec rails test
    python3 - "$source_revision" "$latest_revision" <<'PY'
import hashlib
import json
from pathlib import Path
import subprocess
import sys

base, revision = sys.argv[1:]
manifest_path = Path('site/release-manifest.json')
manifest = json.loads(manifest_path.read_text())
sources = manifest['sources']
changed = [name for name in subprocess.check_output(
    ['git', 'diff', '--name-only', '--no-renames', '-z', base, revision],
).decode().split('\0') if name]
for name in changed:
    path = Path(name)
    if not name.startswith('test/') or not name.endswith('_test.rb'):
        raise ValueError('Non-test change cannot reuse verified output: ' + name)
    previous = subprocess.run(['git', 'show', base + ':' + name], capture_output=True)
    old_hash = hashlib.sha256(previous.stdout).hexdigest() if previous.returncode == 0 else None
    if sources.get(name) != old_hash:
        raise ValueError('Test fingerprint differs from verified base: ' + name)
    if path.is_file():
        sources[name] = hashlib.sha256(path.read_bytes()).hexdigest()
    else:
        sources.pop(name, None)
manifest['test_verification'] = {'base_commit': base, 'commit': revision, 'files': changed,
                               'checks': ['rails db:prepare', 'rails test']}
temporary = manifest_path.with_suffix('.tmp')
temporary.write_text(json.dumps(manifest, separators=(',', ':')))
temporary.replace(manifest_path)
PY
    node script/verify_static.mjs
    git add site/release-manifest.json
    git commit --amend --no-edit
    source_revision=$latest_revision
    continue
  fi

  # Every other change receives a fresh build and the full release gate.
  git reset --hard "$latest_revision"
  node script/generate_daily_horoscope.mjs
  bundle exec ruby script/rebuild_free.rb
  bundle exec ruby script/verify_vector_identity.rb
  bash script/verify_release_qa.sh
  source_revision=$latest_revision
  commit_publication
done
