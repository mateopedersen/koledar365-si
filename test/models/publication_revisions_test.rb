require 'test_helper'
require_relative '../../lib/publication_revisions'
class PublicationRevisionsTest < ActiveSupport::TestCase
  def html(text='Vsebina', assets='a.css')
    %(<html lang="sl-SI"><head><title>Koledar</title><link rel="stylesheet" href="#{assets}"><script type="application/ld+json">{"@graph":[{"@type":"WebPage"}]}</script></head><body><main><h1>Koledar</h1><p>#{text}</p></main></body></html>)
  end
  test 'unknown history and routine rebuilds do not invent modification dates' do
    first=PublicationRevisions.revision(html:html,previous_html:nil,previous_record:nil,now:Time.utc(2026,10,22))
    assert_nil first['modified_at']
    again=PublicationRevisions.revision(html:html('Vsebina','b.css'),previous_html:html,previous_record:first,now:Time.utc(2026,10,23))
    assert_equal first,again
  end
  test 'a real content change dates the page and stays stable on the next build' do
    now=Time.utc(2026,10,22,13)
    changed=PublicationRevisions.revision(html:html('Novo'),previous_html:html,previous_record:nil,now:now)
    assert_equal now.iso8601,changed['modified_at']
    assert_equal changed,PublicationRevisions.revision(html:html('Novo'),previous_html:nil,previous_record:changed,now:now+3600)
    data=JSON.parse(Nokogiri::HTML(PublicationRevisions.apply_html(html('Novo'),changed)).at_css('script').text)
    assert_equal now.iso8601,data['@graph'][0]['dateModified']
  end
  test 'sitemap uses only observed content dates' do
    xml='<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://koledar365.si/</loc><lastmod>2000-01-01</lastmod></url><url><loc>https://koledar365.si/koledar/</loc></url></urlset>'
    doc=Nokogiri::XML(PublicationRevisions.apply_sitemap(xml,{'/koledar/'=>{'modified_at'=>'2026-10-22T13:00:00Z'}}))
    dates=doc.xpath('//*[local-name()="lastmod"]').map(&:text)
    assert_equal ['2026-10-22T13:00:00Z'],dates
  end
end
