import contextlib
import io
import json
import os
from pathlib import Path
import runpy
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'script/wait_production.py'


class PublicationWaitTest(unittest.TestCase):
    def test_push_verifies_artifact_source_even_when_merge_commit_differs(self):
        with tempfile.TemporaryDirectory() as directory:
            site = Path(directory) / 'site'
            site.mkdir()
            (site / 'release-manifest.json').write_text(json.dumps({'source_commit': 'generated-source'}))
            responses = [io.BytesIO(b'{"source_commit":"stale"}'),
                         io.BytesIO(b'{"source_commit":"generated-source"}')]
            original = Path.cwd()
            try:
                os.chdir(directory)
                with patch.dict(os.environ, {'GITHUB_EVENT_NAME': 'push', 'GITHUB_SHA': 'merge-commit'}), \
                     patch('urllib.request.urlopen', side_effect=responses) as fetch, \
                     patch('time.sleep'), contextlib.redirect_stdout(io.StringIO()):
                    runpy.run_path(str(SCRIPT), run_name='__main__')
                self.assertEqual(2, fetch.call_count)
                self.assertIn('generated-source', fetch.call_args.args[0].full_url)
            finally:
                os.chdir(original)


if __name__ == '__main__':
    unittest.main()
