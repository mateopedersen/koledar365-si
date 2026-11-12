"""Exercise the publication push race with disposable local Git repositories."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


PUBLISH = Path(__file__).resolve().parents[1] / "script" / "save_pages_publication.sh"
GENERATED = (
    "site/index.html", "evidence/indexability-audit.json", "functions/cities.js",
    "public/horoscope/daily.json", "data/editorial/horoscopes.json",
    "data/editorial/pages.json", "docs/advanced-calendar-live-urls.txt",
)


def git(path, *args):
    return subprocess.check_output(["git", "-C", str(path), *args], text=True, stderr=subprocess.PIPE).strip()


def write(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


class PublicationRaceTest(unittest.TestCase):
    def run_race(self, competing_path, reject_assertions=False):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo, work, upstream = root / "repo.git", root / "runner", root / "editor"
            git(root, "init", "--bare", "--initial-branch=main", str(repo))
            git(root, "clone", str(repo), str(upstream))
            for key, value in [("user.email", "qa@example.test"), ("user.name", "QA")]:
                git(upstream, "config", key, value)
            for path in GENERATED:
                write(upstream / path, "before\n")
            write(upstream / "script/verify_release_qa.sh", 'echo full-gate >> "$QA_LOG"\n')
            git(upstream, "add", ".")
            git(upstream, "commit", "-qm", "initial release")
            git(upstream, "push", "origin", "main")
            git(root, "clone", "--depth=1", repo.as_uri(), str(work))
            write(work / "site/index.html", "verified bytes\n")

            write(upstream / competing_path, "concurrent change\n")
            git(upstream, "add", competing_path)
            git(upstream, "commit", "-qm", "concurrent change")
            git(upstream, "push", "origin", "main")
            updated = git(upstream, "rev-parse", "HEAD")

            for tool, body in {
                "bundle": (
                    'echo "$*" >> "$QA_LOG"\n'
                    'if [ "$*" = "exec rails test" ]; then exit "$QA_TEST_EXIT"; fi\n'
                    'if [ "$*" = "exec ruby script/rebuild_free.rb" ]; then echo regenerated > site/index.html; fi\n'
                ),
                "node": 'echo "$*" >> "$QA_LOG"\n',
            }.items():
                executable = root / "bin" / tool
                write(executable, "#!/bin/sh\n" + body)
                executable.chmod(0o755)
            log = root / "qa.log"
            env = dict(os.environ, PATH=f"{root / 'bin'}:{os.environ['PATH']}", QA_LOG=str(log),
                       QA_TEST_EXIT="1" if reject_assertions else "0")
            result = subprocess.run(["bash", str(PUBLISH)], cwd=work, env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, int(reject_assertions), result.stderr)
            self.assertEqual(git(repo, "show", f"main:{competing_path}"), "concurrent change")
            self.assertEqual(git(repo, "merge-base", updated, "main"), updated)
            return git(repo, "show", "main:site/index.html"), log.read_text().splitlines()

    def test_only_change_keeps_exact_validated_bytes_and_runs_new_tests(self):
        page, checks = self.run_race("test/integration/seo_test.rb")
        self.assertEqual(page, "verified bytes")
        self.assertEqual(checks, ["exec rails db:prepare", "exec rails test"])

    def test_failed_new_assertion_stops_publication(self):
        page, checks = self.run_race("test/integration/seo_test.rb", reject_assertions=True)
        self.assertEqual(page, "before")
        self.assertIn("exec rails test", checks)

    def test_runtime_drift_is_rebuilt_and_retested(self):
        page, checks = self.run_race("app/models/change.rb")
        self.assertEqual(page, "regenerated")
        self.assertIn("full-gate", checks)


if __name__ == "__main__":
    unittest.main()
