#!/usr/bin/env bash
# Run only in the disposable publication CI checkout, after release verification.
set -euo pipefail
git config user.name 'Koledar365 publication'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
for attempt in 1 2 3; do
  # lunar/prepare.rb updates these generated editorial records before it
  # fingerprints the static release; keep the source snapshot with the site.
  git add site functions/cities.js public/horoscope/daily.json data/editorial/horoscopes.json data/editorial/pages.json
  if git diff --cached --quiet; then exit 0; fi
  git commit -m 'Publish verified calendar and dated editorial content'
  if git push origin HEAD:main; then exit 0; fi
  if [ "$attempt" = 3 ]; then exit 1; fi
  # Regenerate from current main instead of rebasing stale generated HTML.
  git fetch origin main
  git reset --hard origin/main
  node script/generate_daily_horoscope.mjs
  bundle exec ruby script/rebuild_free.rb
  bundle exec ruby script/verify_vector_identity.rb
done
