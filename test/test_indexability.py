"""Regression cases for the static publication indexing gate."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('indexability', Path(__file__).parents[1] / 'script/audit_indexability.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class IndexabilityTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.site = Path(self.temp.name) / 'site'
        self.site.mkdir()
        (self.site / 'robots.txt').write_text('User-agent: *\nDisallow: /upravljanje/\nSitemap: https://koledar365.si/sitemap.xml\n')
        (self.site / 'sitemap.xml').write_text('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://koledar365.si/sitemap-pages.xml</loc></sitemap></sitemapindex>')
        self.sitemap(['/', '/tema/'])
        self.page('/', 'Domov', 'Dobrodošli na koledarju', '<a href="/tema/">Tema</a>')
        self.page('/tema/', 'Tema', 'Posebna vsebina za obiskovalce')

    def sitemap(self, paths):
        (self.site / 'sitemap-pages.xml').write_text('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + ''.join('<url><loc>https://koledar365.si' + path + '</loc></url>' for path in paths) + '</urlset>')

    def page(self, path, title, body, links='', robots='index, follow', canonical=None):
        file = self.site / path.strip('/') / 'index.html'
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(f'<html><head><title>{title}</title><meta name="description" content="Opis {title}"><meta name="robots" content="{robots}"><link rel="canonical" href="{canonical or module.ORIGIN + path}"></head><body><main><h1>{title}</h1><p>{body}</p>{links}</main></body></html>')

    def issues(self):
        return module.audit(self.site)['issues']

    def test_permanent_308_redirects_work_on_older_python(self):
        request = module.Request(module.ORIGIN + '/kontakt')
        redirected = module.Redirects().redirect_request(request, None, 308, 'Permanent Redirect', {}, module.ORIGIN + '/kontakt/')
        self.assertEqual(module.ORIGIN + '/kontakt/', redirected.full_url)
        self.assertEqual('GET', redirected.get_method())

    def test_healthy_publication_passes(self):
        self.assertEqual([], self.issues())

    def test_noindex_sitemap_target_fails(self):
        self.page('/tema/', 'Tema', 'Vsebina', robots='noindex, follow')
        self.assertTrue(any('sitemap target is absent or noindex' in issue for issue in self.issues()))

    def test_missing_sitemap_declaration_and_robots_block_fail(self):
        (self.site / 'robots.txt').write_text('User-agent: *\nDisallow: /tema/\n')
        issues = self.issues()
        self.assertTrue(any('advertise' in issue for issue in issues))
        self.assertTrue(any('blocks a public page' in issue for issue in issues))

    def test_duplicate_content_and_titles_fail(self):
        self.page('/kopija/', 'Tema', 'Posebna vsebina za obiskovalce')
        self.sitemap(['/', '/tema/', '/kopija/'])
        issues = self.issues()
        self.assertTrue(any('Duplicate main content' in issue for issue in issues))
        self.assertTrue(any('Duplicate title' in issue for issue in issues))

    def test_canonical_mismatch_and_orphan_fail(self):
        self.page('/', 'Domov', 'Dobrodošli')
        self.page('/tema/', 'Tema', 'Vsebina', canonical=module.ORIGIN + '/')
        issues = self.issues()
        self.assertTrue(any('canonical is missing' in issue for issue in issues))
        self.assertTrue(any('not reachable' in issue for issue in issues))

    def test_consolidation_requires_redirects_and_removes_old_html(self):
        config = self.site.parent / 'config'
        config.mkdir()
        (config / 'public_page_redirects.json').write_text('{"/kopija/":"/tema/#vsebina"}')
        (self.site / 'free').mkdir()
        (self.site / 'free/search.json').write_text('[]')
        (self.site / '_redirects').write_text('/kopija/ /tema/#vsebina 301\n/kopija /tema/#vsebina 301\n')
        self.page('/tema/', 'Tema', '<span id="vsebina">Posebna vsebina</span>')
        self.assertEqual([], self.issues())
        self.page('/kopija/', 'Stara kopija', 'Stara vsebina')
        self.assertTrue(any('consolidated duplicate was republished' in issue for issue in self.issues()))
        (self.site / '_redirects').write_text('')
        self.assertTrue(any('missing permanent' in issue for issue in self.issues()))

    def test_private_preview_is_excluded(self):
        self.page('/free/views/home/example/', 'Osebni predogled', 'Zasebno', robots='noindex, follow')
        report = module.audit(self.site)
        self.assertTrue(report['passed'])
        self.assertEqual(2, report['indexable_pages'])


if __name__ == '__main__':
    unittest.main()
