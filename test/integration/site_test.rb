require 'test_helper'
class SiteTest < ActionDispatch::IntegrationTest
  test 'home server renders accessible calendar and no fake personal events' do
    get '/'
    assert_response :success
    assert_select 'html[lang=sl]'
    assert_select 'h1',count:1
    assert_select 'table.calendar'
    assert_select 'a[href="/koledar/2030/"]'
    assert_select 'link[rel="preload"][as="image"][type="image/avif"][imagesrcset][imagesizes][fetchpriority="high"]'
    refute_includes response.body,'Sestanek'
  end
  test 'all 48 monthly calendar routes render correct headings' do
    (2027..2030).each do |year|
      CalendarEngine::MONTHS.each do |month|
        get "/koledar/#{year}/#{month}/"
        assert_response :success
        assert_select 'h1',text:/#{year}/
      end
    end
  end
  test 'unknown route is a true 404 and search is noindex' do
    get '/neobstojeca-stran/'
    assert_response :not_found
    assert_select '[data-not-found][aria-labelledby="not-found-title"]',count:1
    assert_select 'h1#not-found-title',text:/za trenutek ustavi/
    assert_select 'form.lost-search[action="/isci/"][role="search"]' do
      assert_select 'input#not-found-query[name="q"][type="search"]',count:1
      assert_select 'button[aria-label="Poišči na Koledar365"]',count:1
    end
    assert_select 'svg[role="img"][aria-labelledby="lost-art-title lost-art-description"]',count:1
    %w[/koledar/2027/ /lunin-koledar/ /prazniki/ /orodja/ /].each do |path|
      assert_select "a[href='#{path}']",minimum:1
    end
    (2027..2030).each { |year|assert_select "a[href='/koledar/#{year}/']",minimum:1 }
    assert_select 'a[href="/kontakt/"]',text:/Sporočite nam/
    assert_select 'meta[name=robots][content="noindex, follow"]'
    get '/isci/',params:{q:'Žan'}
    assert_response :success
    assert_select 'meta[name=robots][content="noindex, follow"]'
    assert_includes response.body,'Žan'
  end
  test 'terms page presents personal operator, practical rules and current legal references' do
    get '/pogoji-uporabe/'
    assert_response :success
    assert_select 'html[lang=sl]'
    assert_select 'body.terms-page'
    assert_select 'h1#terms-title',count:1,text:/Pravila naj bodo jasna/
    assert_select 'nav[aria-label="Vsebina pogojev uporabe"] a[href="#ponudnik"]'
    %w[ponudnik storitve podatki gradiva uporabnik zunanje-strani popravki zakonodaja].each do |section|
      assert_select "section##{section}",count:1
    end
    assert_select 'a[href="mailto:koledar365@gmail.com"]',minimum:1
    assert_select 'a[href="/zasebnost/"]',minimum:1
    assert_select 'a[href="/fotografije-in-licence/"]',minimum:1
    assert_select 'a[href^="https://pisrs.si/"]',minimum:3
    assert_select 'meta[name="description"][content*="Pogoji uporabe Koledar365"]',count:1
  end
  test 'workday endpoint computes and validates' do
    post '/izracun/',params:{tool:'workdays',from:'2029-01-01',to:'2029-12-31',hours:'8',weekdays:%w[1 2 3 4 5],exclude_holidays:'1',include_start:'1',include_end:'1'},as: :json
    assert_response :success
    assert_includes response.parsed_body['result'],'248'
    post '/izracun/',params:{tool:'workday_shift',from:'2027-04-26',delta:'1',weekdays:%w[1 2 3 4 5],exclude_holidays:'1'},as: :json
    assert_response :success
    assert_equal '2027-04-28',response.parsed_body.dig('workday_shift','target_date')
    assert_equal ['2027-04-27'],response.parsed_body.dig('workday_shift','excluded_holidays')
    post '/izracun/',params:{tool:'workday_shift',from:'2027-04-26',delta:'1',weekdays:[],exclude_holidays:'1'},as: :json
    assert_response :unprocessable_entity
    post '/izracun/',params:{tool:'workday_shift',from:'2030-12-31',delta:'1',weekdays:%w[1 2 3 4 5],exclude_holidays:'1'},as: :json
    assert_response :unprocessable_entity
    post '/izracun/',params:{tool:'week',date:'2029-02-29'},as: :json
    assert_response :unprocessable_entity
  end
  test 'workday calculator offers both date counting modes and official holiday guidance' do
    get '/kalkulator-delovnih-dni/'
    assert_response :success
    assert_select '[data-workday-calculator]'
    assert_select '[data-wdc-mode="range"]'
    assert_select '[data-wdc-mode="shift"]'
    assert_select '[data-wdc-form="range"] input[name="weekdays[]"]',count:7
    assert_select '[data-wdc-form="shift"] input[name="delta"][min="-1000"][max="1000"]'
    assert_select 'a[href="https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/"]'
    assert_select 'script[src*="workdays"]'
    assert_select 'link[rel="stylesheet"][href*="workdays"]'
    assert_select '.tool-panel',count:0
  end
  test 'workdays landing page presents correct annual data and an adjustable monthly overview' do
    # Production's legacy Page row still labels this landing page as 2026.
    # The landing page follows Ljubljana's current year, not the legacy Page row.
    Page.find_by!(path:'/delovni-dnevi/').update_column(:year,2026)
    travel_to(Time.zone.local(2026,10,21,12)) { get '/delovni-dnevi/' }
    assert_response :success
    assert_select 'html[lang=sl]'
    assert_select 'h1#workdays-title', text: 'Delovni dnevi in ure 2026–2030 v Sloveniji'
    assert_select '[data-workdays-dashboard][data-year="2026"]'
    assert_select '[data-workdays-dashboard] [data-year-days]', text: '254'
    assert_select '[data-workdays-card]', count: 12
    assert_select '[data-workdays-card][data-month="1"][href*="from=2026-01-01"]'
    assert_select '[data-workdays-controls] input[type="number"][data-workdays-hours]'
    assert_select '[data-workdays-controls] input[type="checkbox"][data-workdays-exclude][checked]'
    assert_select 'script[src*="workdays"]'
    assert_select 'link[rel="stylesheet"][href*="workdays"]'
    assert_select '#design-gallery[data-export-options]'

    assert_select '.workdays-year-picker a[href="/delovni-dnevi/2027/"]','2027'
    get '/delovni-dnevi/2027/'
    assert_select '[data-workdays-dashboard][data-year="2027"] [data-year-days]', text: '255'
    get '/delovni-dnevi/2029/'
    assert_response :success
    assert_select 'body.gallery-page'
    assert_select '.workdays-hero h1#workdays-title', count: 1
    assert_select '.workdays-hero__copy > p', minimum: 1
    assert_select '[data-workdays-dashboard][data-year="2029"] [data-year-days]', text: '248'
    assert_select '[data-workdays-card]', count: 12
    get '/delovni-dnevi/2029/september/'
    assert_response :success
    assert_select '.gallery-context .data-table tbody tr', count: 1
    get '/delovni-dnevi/2026/'
    assert_response :success
    assert_select '[data-workdays-dashboard][data-year="2026"]'
    assert_select '[data-workdays-dashboard] [data-year-days]', text: '254'
    assert_select '[data-workdays-card]', count: 12
    assert_select '[data-workdays-card][data-month="1"][href*="from=2026-01-01"]'
  end
  test 'contact is persisted and administrator requires authentication' do
    assert_difference('ContactMessage.count',1) do
      post '/kontakt/',params:{name:'QA test',email:'qa@example.com',message:'Preverjanje obrazca za stik.'},as: :json
      assert_response :success
    end
    get '/upravljanje/'
    assert_redirected_to '/upravljanje/prijava/'
  end
  test 'another session cannot download private export' do
    o=PrintCatalog.normalize(name:'Zasebni naslov',notes:'Zasebni zapiski')
    r=PrintRequest.create!(fingerprint:'private-test',options:o,private_file:true,owner_token:'a-secret-owner')
    get "/izvozi/#{r.id}/"
    assert_response :not_found
    assert_equal 'private, no-store',response.headers['Cache-Control']
  end
end
class CityPageTest < ActionDispatch::IntegrationTest
  test 'city selector exposes every city and the complete attribution page' do
    get '/'
    assert_select '#city-select option',count:69
    assert_select '#city-photo[src="/images/cities/ljubljana.jpg"][srcset][width][height]'
    assert_select '#city-photo-avif[type="image/avif"][srcset^="/images/responsive/ljubljana-960-"]'
    get '/fotografije-in-licence/'
    assert_response :success
    assert_select 'h1',text:'Fotografije in licence'
    assert_select '.city-photo-license',count:69
    assert_select '.holiday-photo-licenses .photo-license',count:58
    assert_select '.city-photo-license a[href^="https://commons.wikimedia.org/"]',count:69
    get '/vreme/not-a-city/'
    assert_response :not_found
  end
end
