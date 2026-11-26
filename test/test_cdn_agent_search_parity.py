import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'script'))
from cdn_agent_search_parity import restore_agent_search_html


class AgentSearchParityTest(unittest.TestCase):
    origin = 'https://koledar365.si'
    markup = (
        b'<meta name="agent:instructions" content="Use this search API to find relevant content '
        b'across this site with keywords or natural-language queries, instead of crawling '
        b'individual pages. Results are returned in Markdown.">'
        b'<meta name="agent:endpoint" content="https://koledar365.si/.well-known/search?q={query}">'
        b'<meta name="agent:method" content="GET">'
        b'<meta name="agent:documentation" '
        b'content="https://developers.cloudflare.com/ai-search/how-to/search-for-agents/">'
    )
    source = b'<html><head><title>Prazniki</title></head><body>Prazniki</body></html>'

    def test_removes_exact_insertion_and_keeps_every_other_byte(self):
        live = self.source.replace(b'</title>', b'</title>' + self.markup)
        self.assertEqual(restore_agent_search_html(live, self.origin), (self.source, True))
        altered = live.replace(b'<body>', b'<body hidden>')
        self.assertNotEqual(restore_agent_search_html(altered, self.origin)[0], self.source)

    def test_preserves_unapproved_scope_or_markup(self):
        for live in (
            self.source,
            self.source.replace(b'<body>', b'<body>' + self.markup),
            self.source.replace(b'</title>', b'</title>' + self.markup * 2),
            self.source.replace(b'</title>', b'</title>' + self.markup.replace(b'koledar365.si', b'example.org')),
            self.source.replace(b'</title>', b'</title>' + self.markup.replace(b'content="GET"', b'content="POST"')),
        ):
            with self.subTest(live=live):
                self.assertEqual(restore_agent_search_html(live, self.origin), (live, False))


if __name__ == '__main__':
    unittest.main()
