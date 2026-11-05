import hashlib
import io
import unittest
from urllib.error import HTTPError
from preview_source import NoRedirect, publication_template


class Response(io.BytesIO):
    status = 200


class Opener:
    def __init__(self, body=b'<html>verified historical template</html>', status=200):
        self.body, self.status, self.requests = body, status, []

    def open(self, request, timeout):
        self.requests.append(request)
        if self.status != 200:
            raise HTTPError(request.full_url, self.status, 'unavailable', {}, None)
        return Response(self.body)


class PrivatePreviewSourceTest(unittest.TestCase):
    def setUp(self):
        self.client = Opener()
        self.commit = 'a' * 40
        self.digest = hashlib.sha256(self.client.body).hexdigest()

    def test_exact_private_commit_and_checksum_with_read_only_job_token(self):
        result = publication_template(self.commit, 'horoskop/oven/index.html', self.digest,
                                      'test-job-token', self.client)
        self.assertEqual(result, self.client.body)
        request = self.client.requests[0]
        self.assertEqual(request.full_url,
                         'https://api.github.com/repos/mateopedersen/koledar365-si/contents/site/'
                         'horoskop/oven/index.html?ref=' + self.commit)
        self.assertEqual(request.get_header('Authorization'), 'Bearer test-job-token')
        self.assertEqual(request.get_header('Accept'), 'application/vnd.github.raw+json')

    def test_missing_token_or_untrusted_commit_path_hash_never_sends(self):
        for commit, path, digest, token in [
            (self.commit, 'horoskop/index.html', self.digest, ''),
            ('main', 'horoskop/index.html', self.digest, 'test'),
            (self.commit, 'horoskop/../secrets/index.html', self.digest, 'test'),
            (self.commit, 'horoskop/index.html', 'invalid', 'test'),
        ]:
            with self.subTest(commit=commit, path=path):
                with self.assertRaises(ValueError):
                    publication_template(commit, path, digest, token, self.client)
        self.assertEqual(self.client.requests, [])

    def test_changed_or_inaccessible_source_stops_verification(self):
        for client in [Opener(b'changed bytes'), Opener(status=404), Opener(status=403)]:
            with self.assertRaises(ValueError):
                publication_template(self.commit, 'horoskop/index.html', self.digest, 'test', client)

    def test_redirect_never_forwards_the_credential(self):
        self.assertIsNone(NoRedirect().redirect_request(None, None, 302, '', {}, 'https://other.invalid'))


if __name__ == '__main__':
    unittest.main()
