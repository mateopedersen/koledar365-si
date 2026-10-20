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
    get '/sitemap-random.xml'
    assert_response :not_found
  end
  test 'empty personal calendar is a valid ICS download' do
    post '/ics/izvoz/',params:{events:[]},as: :json
    assert_response :success
    assert_includes response.body,'BEGIN:VCALENDAR'
    refute_includes response.body,'BEGIN:VEVENT'
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
