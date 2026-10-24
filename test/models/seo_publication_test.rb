require 'test_helper'
require 'tmpdir'
require_relative '../../lib/seo_publication'

class SeoPublicationTest < ActiveSupport::TestCase
  setup do
    @temporary = Dir.mktmpdir('koledar-seo-')
    @site = Pathname(@temporary).join('site')
    @site.mkpath
    @guide = Pathname(@temporary).join('guide.json')
    @guide.write(JSON.generate(name: 'Koledar365.si', summary: 'Slovenski koledarji.', introduction: 'Viri in datumi.', sections: [{title: 'Koledarji', links: [['/', 'Domača stran.']]}]))
    @site.join('sitemap-pages.xml').write('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://koledar365.si/removed/</loc><lastmod>2026-01-01</lastmod></url></urlset>')
    page('/')
  end
  teardown { FileUtils.remove_entry(@temporary) }

  def page(path, robots: 'index, follow', canonical: nil)
    directory = @site.join(path.delete_prefix('/')); directory.mkpath
    directory.join('index.html').write(%(<html lang="sl"><head><meta name="robots" content="#{robots}"><link rel="canonical" href="#{canonical || SeoPublication::ORIGIN + path}"></head><body><h1>Koledar &amp; datumi</h1></body></html>))
  end

  test 'new canonical pages enter and removed or noindex pages leave automatically' do
    page('/koledar/2028/februar/')
    page('/isci/', robots: 'noindex, follow')
    report = SeoPublication.write!(site: @site, guide: @guide)
    assert_equal 2, report[:sitemap_urls]
    xml = Nokogiri::XML(@site.join('sitemap-pages.xml').read) { |c| c.strict }
    assert_equal ['https://koledar365.si/', 'https://koledar365.si/koledar/2028/februar/'], xml.xpath('//*[local-name()="loc"]').map(&:text)
    assert_empty xml.xpath('//*[local-name()="lastmod" or local-name()="priority" or local-name()="changefreq"]')
    before = @site.join('sitemap-pages.xml').read
    SeoPublication.write!(site: @site, guide: @guide)
    assert_equal before, @site.join('sitemap-pages.xml').read
    FileUtils.remove_entry(@site.join('koledar'))
    assert_equal 1, SeoPublication.write!(site: @site, guide: @guide)[:sitemap_urls]
  end

  test 'conflicting canonical and missing guide destinations fail publication' do
    page('/wrong/', canonical: 'https://koledar365.si/')
    assert_raises(RuntimeError) { SeoPublication.write!(site: @site, guide: @guide) }
    FileUtils.remove_entry(@site.join('wrong'))
    @guide.write(@guide.read.sub('[["/",', '[["/missing/",'))
    assert_raises(RuntimeError) { SeoPublication.write!(site: @site, guide: @guide) }
  end

  test 'image discovery uses originals, meaningful downloads and only indexable landing pages' do
    @site.join('images').mkpath
    %w[original.webp small.avif moon.webp hidden.webp icon.svg].each { |file| @site.join('images',file).write('fixture') }
    @site.parent.join('data').mkpath
    @site.parent.join('data/web_image_variants.json').write(JSON.generate('/images/original.webp' => {'variants' => [{'avif' => '/images/small.avif'}]}))
    @site.join('index.html').write(@site.join('index.html').read.sub('</body>', '<img src="/images/small.avif" alt="Luna"><img src="/images/icon.svg" alt=""><a href="/images/moon.webp">Prenesi sliko</a></body>'))
    page('/private/', robots: 'noindex')
    @site.join('private/index.html').write(@site.join('private/index.html').read.sub('</body>', '<img src="/images/hidden.webp" alt="Zasebno"></body>'))
    report = SeoPublication.write!(site: @site, guide: @guide)
    assert_equal 2, report[:additional_images]
    xml = Nokogiri::XML(@site.join('sitemap-images.xml').read) { |c| c.strict }
    assert_equal ['https://koledar365.si/images/original.webp', 'https://koledar365.si/images/moon.webp'], xml.xpath('//*[local-name()="image"]/*[local-name()="loc"]').map(&:text)
    assert_equal ['https://koledar365.si/'], xml.xpath('//*[local-name()="url"]/*[local-name()="loc"]').map(&:text)
    assert_includes @site.join('sitemap.xml').read, 'sitemap-images.xml'
  end

  test 'guide is concise Slovenian Markdown using rendered titles and canonical links' do
    report = SeoPublication.write!(site: @site, guide: @guide)
    text = @site.join('llms.txt').read
    assert_equal 1, text.scan(/^# /).size
    assert_equal 1, report[:llms_links]
    assert_includes text, '- [Koledar & datumi](https://koledar365.si/): Domača stran.'
  end

  test 'lastmod requires matching content revision evidence and survives unchanged rebuilds' do
    record = {'sha256' => PublicationRevisions.fingerprint(@site.join('index.html').read), 'modified_at' => '2026-01-02T12:00:00Z'}
    @site.join('page-revisions.json').write(JSON.generate('/' => record))
    2.times do
      SeoPublication.write!(site: @site, guide: @guide)
      assert_equal ['2026-01-02T12:00:00Z'], Nokogiri::XML(@site.join('sitemap-pages.xml').read).xpath('//*[local-name()="lastmod"]').map(&:text)
    end
    record['sha256'] = 'invalid'
    @site.join('page-revisions.json').write(JSON.generate('/' => record))
    assert_raises(RuntimeError) { SeoPublication.write!(site: @site, guide: @guide) }
  end
end
