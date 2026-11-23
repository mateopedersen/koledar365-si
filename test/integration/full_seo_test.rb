require 'test_helper'
class FullSeoTest < ActionDispatch::IntegrationTest
  test 'all published pages retain distinct crawlable metadata and meaningful tables' do
    paths=Page.published.pluck(:path).reject{|p|p.match?(PagesController::REMOVED_NAME_PATHS)||PublicPagePolicy.redirect(p)}
    paths+=SunEngine::CITIES.keys.map{|id|"/soncni-vzhod-in-zahod/#{id}/"}
    paths.uniq.each do |path|
      get path
      assert_response :success,path
      assert_select 'html[lang="sl-SI"]',count:1
      assert_select 'main h1',count:1
      assert_select 'link[rel=canonical][href=?]',"https://koledar365.si#{path}",count:1
      assert_select 'meta[name="twitter:image:alt"]' do |nodes| assert nodes.first['content'].present?,path end
      doc=Nokogiri::HTML(response.body)
      doc.css('main table').each do |table|
        assert table['aria-label'].present? || table['aria-labelledby'].present? || table.at_css('caption'),"Unnamed table: #{path}"
        assert table.css('th').all?{|th|th['scope'].present?||th['id'].present?},"Unassociated header: #{path}"
      end
      graph=JSON.parse(doc.at_css('script[type="application/ld+json"]').text).fetch('@graph')
      ids=graph.filter_map{|n|n['@id']};assert_equal ids.uniq,ids,"Repeated schema id: #{path}"
    end
  end
  test 'February 2028 contains real facts and useful matching period links' do
    get '/koledar/2028/februar/'
    assert_select '.calendar-period-intro h1', text: 'Koledar za februar 2028'
    assert_select 'meta[name="description"][content*="Prestopni februar"]', count: 1
    assert_select '.calendar-collection-numbers dd', text: '29', count: 1
    assert_select '.calendar-period-intro + #calendar-designs', count: 1
    assert_select '.calendar-period-intro a[href="#koledarski-pregled"]', count: 1
    assert_select '#calendar-facts a[href="https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/"]', count: 1
    assert_select 'time[datetime="2028-02-29"]'
    assert_select 'a[href="/delovni-dnevi/2028/februar/"]'
    assert_select 'a[href="/lunin-koledar/2028/februar/"]'
    assert_select 'th[scope=col][abbr="ponedeljek"]'
  end
  test 'calendar editorial links reach the intended school holiday sections' do
    {
      '/koledar/2027/februar/' => 'zimske-regije',
      '/koledar/2027/april/' => 'pocitnice-may',
      '/koledar/2028/maj/' => 'pocitnice-may',
      '/koledar/2029/februar/' => 'zimske-regije',
      '/koledar/2029/junij/' => 'pocitnice-summer',
      '/koledar/2030/december/' => 'pocitnice-newyear'
    }.each do |path, section|
      get path
      assert_response :success
      assert_select 'main a[href=?]', "/solske-pocitnice/##{section}", count: 1
    end
  end
  test 'homepage has one responsive preload instead of repeated identical declarations' do
    get '/'
    assert_select 'link[rel=preload][as=image]',count:1
  end
end
