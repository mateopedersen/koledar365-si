import importlib.util
import io
import json
import unittest
import urllib.error
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('notify', Path(__file__).with_name('notify.py'))
notify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notify)

class NotifyTests(unittest.TestCase):
    def test_added_updated_removed_and_unchanged(self):
        old = {'/same/': 'a', '/changed/': 'b', '/removed/': 'c'}
        new = {'/same/': 'a', '/changed/': 'd', '/new/': 'e'}
        self.assertEqual(notify.changes(old, new), ['/changed/', '/new/', '/removed/'])

    def test_inventory_rejects_foreign_or_duplicate_urls(self):
        def xml(urls):
            return '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>'+u+'</loc></url>' for u in urls) + '</urlset>'
        revisions = {'/': {'sha256': 'a'*64}}
        self.assertEqual(notify.inventory(xml(['https://koledar365.si/']), revisions, 'https://koledar365.si'), {'https://koledar365.si/': 'a'*64})
        for urls in [['https://example.com/'], ['https://koledar365.si/']*2, ['https://koledar365.si/missing/']]:
            with self.assertRaises(ValueError): notify.inventory(xml(urls), revisions, 'https://koledar365.si')

    def test_pending_key_is_retried_and_payload_is_correct(self):
        class Response(io.BytesIO):
            def __init__(self, status): super().__init__(b''); self.status=status
        config={'origin': 'https://koledar365.si', 'key': 'a'*32, 'endpoint': 'https://api.indexnow.org/indexnow'}
        with patch.object(notify.urllib.request, 'urlopen', side_effect=[Response(202), Response(200)]) as send:
            self.assertEqual(notify.submit(config, ['https://koledar365.si/'], sleeper=lambda _: None), [{'urls':1,'status':200}])
            self.assertEqual(send.call_count, 2)
            body=json.loads(send.call_args.args[0].data)
            self.assertEqual(body['host'], 'koledar365.si')
            self.assertEqual(body['keyLocation'], 'https://koledar365.si/'+'a'*32+'.txt')

    def test_invalid_key_fails_without_retry_and_empty_batch_is_not_sent(self):
        config={'origin': 'https://koledar365.si', 'key': 'a'*32, 'endpoint': 'https://api.indexnow.org/indexnow'}
        with patch.object(notify.urllib.request, 'urlopen', side_effect=urllib.error.HTTPError(config['endpoint'],403,'Invalid key',{},None)) as send:
            self.assertEqual(notify.submit(config, []), [])
            send.assert_not_called()
            with self.assertRaises(RuntimeError): notify.submit(config, ['https://koledar365.si/'])
            self.assertEqual(send.call_count, 1)

if __name__ == '__main__': unittest.main()
