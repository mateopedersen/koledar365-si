require 'test_helper'
class SeoTest < ActionDispatch::IntegrationTest
  test 'page metadata describes the period and schema matches visible breadcrumbs' do
    get '/koledar/2028/februar/',params:{view:'week',date:'2028-02-29'}
    assert_response :success
    assert_select 'link[rel=canonical][href="https://koledar365.si/koledar/2028/februar/"]',count:1
    assert_select 'meta[name=description]' do |tags|
      assert_includes tags.first['content'],'februar 2028'
    end
    assert_select 'script[type="application/ld+json"]' do |tags|
      schema=JSON.parse(tags.first.text)
      crumbs=schema['@graph'].find { |r|r['@type']=='BreadcrumbList' }['itemListElement']
      assert_equal ['Domov','Letni koledarji','Koledar – februar 2028'],crumbs.map { |r|r['name'] }
      refute tags.first['nonce'].blank?
    end
  end
  test 'homepage title does not duplicate brand and missing routes stay 404' do
    get '/'
    assert_select 'title' do |tags|
      assert_equal 1,tags.first.text.scan('Koledar365').size
    end
    assert_select '.stats dt',count:3
    assert_select '.stats dd',count:3
    get '/neobstojeca-seo-stran/'
    assert_response :not_found
    assert_select 'link[rel=canonical]',count:0
    assert_select 'script[type="application/ld+json"]',count:0
    assert_equal 'noindex, follow',response.headers['X-Robots-Tag']
  end
  test 'only published records enter a sitemap and invalid sitemap is not a duplicate' do
    Page.find_by!(path:'/koledar/2027/').update!(status:'published')
    get '/sitemap-pages.xml'
    assert_includes response.body,'https://koledar365.si/koledar/2027/'
    refute_includes response.body,'https://koledar365.si/godovi/'
    refute_includes response.body,'/koledar-z-imenom/'
    refute_includes response.body,'/imena/'
    get '/sitemap.xml'
    refute_includes response.body,'sitemap-names.xml'
    get '/sitemap-names.xml'
    assert_response :not_found
    get '/sitemap-random.xml'
    assert_response :not_found
  end
  test 'duplicate school landing pages consolidate with permanent redirects' do
    PublicPagePolicy::REDIRECTS.each do |source,destination|
      [source,source.delete_suffix('/')].each do |path|
        get path
        assert_response :moved_permanently
        assert_redirected_to destination
      end
    end
    get '/sitemap-pages.xml'
    PublicPagePolicy::REDIRECTS.each_key { |path| refute_includes response.body,"<loc>https://koledar365.si#{path}</loc>" }
    get '/solske-pocitnice/'
    %w[autumn newyear may summer].each { |id| assert_select "#pocitnice-#{id}",count:1 }
  end

  test 'robots advertises the sitemap and the directory links to public archives' do
    get '/robots.txt'
    assert_response :success
    assert_includes response.body,'Sitemap: https://koledar365.si/sitemap.xml'
    assert_includes response.body,'Disallow: /upravljanje/'
    assert_equal Rails.root.join('public/robots.txt').read,response.body
    %w[/lunin-koledar/2026/oktober/ /pomembni-dnevi/januar/ /tedenski-koledar/2026/].each { |path| Page.find_by!(path:path).update!(status:'published') }
    Page.find_by!(path:'/solske-pocitnice/2028-2029/').update!(status:'held')
    get '/orodja/'
    assert_select 'a[href="/lunin-koledar/2026/oktober/"]'
    assert_select 'a[href="/pomembni-dnevi/januar/"]'
    assert_select 'a[href="/tedenski-koledar/2026/"]'
    PublicPagePolicy::REDIRECTS.each_key { |path| assert_select 'a[href="'+path+'"]',count:0 }
    assert_select 'a[href="/solske-pocitnice/2028-2029/"]',count:0
  end

  test 'empty personal calendar is a valid ICS download' do
    post '/ics/izvoz/',params:{events:[]},as: :json
    assert_response :success
    assert_includes response.body,'BEGIN:VCALENDAR'
    refute_includes response.body,'BEGIN:VEVENT'
  end
  test 'sunrise hub and all 69 city pages render the interactive experience' do
    get '/soncni-vzhod-in-zahod/'
    assert_response :success
    assert_select '[data-sun-city] option',count:69
    assert_select '.sun-city-link',count:69 do |cards|
      city_index=CityCatalog.all.index_by { |city|city.fetch('id') }
      cards.each do |card|
        link=card.at_css('.sun-city-link__main')
        id=link['href'].match(%r{/soncni-vzhod-in-zahod/([a-z0-9-]+)/})[1]
        city=city_index.fetch(id)
        mark=card.at_css('.sun-city-link__mark')
        assert_equal 'svg',mark.name
        title_id=mark['aria-labelledby'].split.first
        assert_equal "#{city.fetch('name')} – fotografija mesta",mark.at_css("title##{title_id}").text
        assert_includes mark.to_html,'href="data:image/jpeg;base64,'
        assert Rails.root.join('data','city-marks',"#{id}.svg").file?
        refute Rails.root.join('public','images','city-marks',"#{id}.svg").exist?
        credit=card.at_css('.sun-city-link__credit')
        assert_equal "/fotografije-in-licence/##{id}",credit['href']
        assert_includes credit.text,city.dig('photo','author')
        assert_includes credit.text,city.dig('photo','license')
      end
    end
    assert_select 'a[href="/soncni-vzhod-in-zahod/zrece/"]',minimum:1
    assert_select '[data-sun-scene]'
    assert_select 'script[src*="sun"]'

    get '/soncni-vzhod-in-zahod/ajdovscina/',params:{date:'2027-07-15'}
    assert_response :success
    assert_select 'title',/Sončni vzhod in zahod – Ajdovščina/
    assert_select 'link[rel=canonical][href="https://koledar365.si/soncni-vzhod-in-zahod/ajdovscina/"]'
    assert_select '[data-sun-city] option[selected][value="ajdovscina"]'
    assert_select '[data-sun-value="sunrise"]'

    get '/soncni-vzhod-in-zahod/unknown-place/'
    assert_response :not_found
  end
  test 'legal pages contain an accessible nonmodal consent bar with opt in off' do
    get '/piskotki/'
    assert_response :success
    assert_select 'section.cookie-bar[hidden]'
    assert_select 'dialog#cookies',count:0
    assert_select '#cookie-preferences[checked]',count:0
    assert_select '[data-consent="necessary"]'
    assert_select '[data-consent="all"]'
    get '/prazniki/gregorjevo/'
    assert_select 'a[href="https://www.ljubljana.si/sl/aktualno/novice/na-gregorjevo-se-pticki-zenijo"]'
  end
end

class RemovedNameDirectoryTest < ActionDispatch::IntegrationTest
  test 'name directory and its individual pages are removed without placeholders' do
    ['/koledar-z-imenom/','/koledar-z-imenom/ana/','/koledar-z-imenom/ana/?page=2',
     '/imena/','/imena/najpogostejsa/','/imena/zenska/?page=2'].each do |path|
      get path
      assert_response :not_found
      assert_select 'a[href="/koledar-z-imenom/"]',count:0
      assert_select 'a[href="/imena/najpogostejsa/"]',count:0
    end
    get '/'
    assert_select 'a[href="/koledar-z-imenom/"]',count:0
    assert_select 'a[href="/imena/"]',count:0
    get '/isci/',params:{q:'Ana'}
    assert_no_match %r{/koledar-z-imenom/|/imena/},response.body
  end
end

class SocialImageTest < ActionDispatch::IntegrationTest
  test 'social images identify the calendar period' do
    get '/koledar/2029/april/'
    assert_select 'meta[property="og:image:alt"][content="Koledar – april 2029"]'
  end
end
