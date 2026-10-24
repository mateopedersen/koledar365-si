import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'script'))
from cdn_email_parity import restore_email_html

def encoded(value):
    return '37' + bytes(c ^ 0x37 for c in value.encode()).hex()

class EmailParityTest(unittest.TestCase):
    def setUp(self):
        self.email = 'koledar365@example.com'
        self.hex = encoded(self.email)
        self.script = '<script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>'
        self.source = f'<p><a href="mailto:{self.email}">{self.email}</a> {self.email}</p>'.encode()
        self.live = (f'<p><a href="/cdn-cgi/l/email-protection#{self.hex}"><span class="__cf_email__" data-cfemail="{self.hex}">[email&#160;protected]</span></a> <a href="/cdn-cgi/l/email-protection" class="__cf_email__" data-cfemail="{self.hex}">[email&#160;protected]</a></p>'+self.script).encode()

    def test_exact_restoration(self):
        restored, counts = restore_email_html(self.live)
        self.assertEqual(restored, self.source)
        self.assertEqual(counts, dict(email_text=2, mailto_links=1, decoder_scripts=1))

    def test_generic_mailto_query_restoration(self):
        query = '?subject=%C5%A0olske%20po%C4%8Ditnice&amp;body=https%3A%2F%2Fkoledar365.si%2F'
        source = f'<a href="mailto:{query}">Share</a>'.encode()
        live = (f'<a href="/cdn-cgi/l/email-protection#{encoded(query)}">Share</a>'+self.script).encode()
        restored, counts = restore_email_html(live)
        self.assertEqual(restored, source)
        self.assertEqual(counts, dict(email_text=0, mailto_links=1, decoder_scripts=1))

    def test_tampered_email_fails_comparison(self):
        self.assertNotEqual(restore_email_html(self.live.replace(self.hex.encode(), encoded('wrong@example.com').encode()))[0], self.source)

    def test_unrelated_html_difference_is_preserved(self):
        self.assertNotEqual(restore_email_html(self.live.replace(b'<p>', b'<p hidden>'))[0], self.source)

    def test_unexpected_script_is_preserved(self):
        self.assertNotEqual(restore_email_html(self.live.replace(b'email-decode.min.js', b'other.js'))[0], self.source)

    def test_plain_source_is_unchanged(self):
        self.assertEqual(restore_email_html(self.source)[0], self.source)

if __name__ == '__main__': unittest.main()
