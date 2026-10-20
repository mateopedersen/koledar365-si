require 'test_helper'
class SiteTest < ActionDispatch::IntegrationTest
  test 'home server renders accessible calendar and no fake personal events' do
    get '/'
    assert_response :success
    assert_select 'html[lang=sl]'
    assert_select 'h1',count:1
    assert_select 'table.calendar'
    assert_select 'a[href="/koledar/2030/"]'
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
    get '/isci/',params:{q:'Žan'}
    assert_response :success
    assert_select 'meta[name=robots][content="noindex, follow"]'
    assert_includes response.body,'Žan'
  end
  test 'workday endpoint computes and validates' do
    post '/izracun/',params:{tool:'workdays',from:'2029-01-01',to:'2029-12-31',hours:'8',weekdays:%w[1 2 3 4 5],exclude_holidays:'1',include_start:'1',include_end:'1'},as: :json
    assert_response :success
    assert_includes response.parsed_body['result'],'248'
    post '/izracun/',params:{tool:'week',date:'2029-02-29'},as: :json
    assert_response :unprocessable_entity
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
