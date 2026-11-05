"""Read one hash-bound historical template from this private repository."""
import hashlib
import re
from urllib.error import HTTPError
from urllib.request import Request, HTTPRedirectHandler, build_opener


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        # Never forward a GitHub credential to a raw-content/CDN redirect.
        return None


def publication_template(snapshot, path, expected_sha256, token, opener=None):
    if not re.fullmatch(r'[a-f0-9]{40}', snapshot):
        raise ValueError('Missing trusted publication commit')
    if not re.fullmatch(r'horoskop/(?:[a-z0-9-]+/)?index\.html', path):
        raise ValueError('Unexpected publication template path')
    if not re.fullmatch(r'[a-f0-9]{64}', expected_sha256):
        raise ValueError('Missing trusted publication checksum')
    if not token:
        raise ValueError('Read-only GitHub token required for the private publication template')
    request = Request(
        'https://api.github.com/repos/mateopedersen/koledar365-si/contents/site/'
        + path + '?ref=' + snapshot,
        headers={
            'Authorization': 'Bearer ' + token,
            'Accept': 'application/vnd.github.raw+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'Koledar365-Preview-Verification/1.0',
        },
    )
    client = opener if opener is not None else build_opener(NoRedirect())
    try:
        with client.open(request, timeout=40) as response:
            if response.status != 200:
                raise ValueError('Publication template HTTP ' + str(response.status))
            body = response.read(16 * 1024 * 1024 + 1)
    except HTTPError as error:
        raise ValueError('Publication template HTTP ' + str(error.code)) from None
    if len(body) > 16 * 1024 * 1024 or hashlib.sha256(body).hexdigest() != expected_sha256:
        raise ValueError('Publication fallback differs from preview manifest')
    return body
