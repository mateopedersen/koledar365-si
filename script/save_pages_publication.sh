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
  # exact verified publication (including its original source manifest) and
  # rerun the Rails suite against the new assertions before publishing it.
  if git merge-base --is-ancestor "$source_revision" "$latest_revision" &&
     git diff --quiet "$source_revision" "$latest_revision" -- . ':(exclude,glob)test/**/*_test.rb'; then
    verified_publication=$(git rev-parse HEAD)
    git reset --hard "$latest_revision"
    git cherry-pick "$verified_publication"
    RAILS_ENV=test bundle exec rails db:prepare
    RAILS_ENV=test bundle exec rails test
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
