require 'test_helper'

class SlovenianOccasionsTest < ActionDispatch::IntegrationTest
  test 'the four-year observance pages distinguish civil and liturgical dates from legal holidays' do
    get '/pomembni-dnevi/pepelnica/'
    assert_response :success
    assert_select '.observance-year-card', count: 4
    assert_select '[data-observance-date="2027-02-10"] .observance-date-status', text: 'Ni dela prost dan'
    assert_select '.observance-local', text: /pepeljenje/

    get '/pomembni-dnevi/dan-slovenske-zastave/'
    assert_response :success
    assert_select '[data-observance-date="2030-04-07"] .observance-date-status', text: 'Ni dela prost dan'
    assert_equal 2, CalendarEvent.where(on: Date.new(2027,4,7), slug: %w[dan-slovenske-zastave svetovni-dan-zdravja]).count
  end

  test 'local observances use current municipal dates and national article archives' do
    get '/pomembni-dnevi/praznik-ptuja/'
    assert_response :success
    assert_select '.observance-kicker', text: /Občinski praznik/
    assert_select '.observance-lead', text: /sv\. Jurija, zavetnika mesta\.$/
    assert_select '[data-observance-date="2027-04-23"] .observance-date-status', text: 'Ni dela prost dan'
    assert_select '[data-observance-date="2027-08-05"]', count: 0

    get '/pomembni-dnevi/2027/', params: { category: 'local', q: 'Ptuj' }
    assert_response :success
    assert_select 'tbody a[href="/pomembni-dnevi/praznik-ptuja/"]', count: 1
    assert_select 'tbody a[href="/festivali/#kurentovanje"]', count: 0

    get '/prazniki/dan-drzavnosti/'
    assert_response :success
    assert_select '.observance-local a[href="https://doodles.google/doodle/slovenia-statehood-day-2023/"]', count: 1
  end

  test 'the festival directory shows sourced editions and undated future years' do
    get '/festivali/'
    assert_response :success
    assert_select '[data-festival-card] a picture img[alt]', count: OccasionCatalog.festivals.size
    assert_select 'select[name=kraj] option[value=bohinj]', text: 'Bohinj'
    assert_select '#kurentovanje a[href="/festivali/kurentovanje/"]', count: 1

    get '/festivali/kurentovanje/'
    assert_response :success
    assert_select 'link[rel=canonical][href="https://koledar365.si/festivali/kurentovanje/"]', count: 1
    assert_select '#kurentovanje .festival-edition time[datetime="2027-02-03"]', count: 1
    assert_select '#kurentovanje .festival-edition time[datetime="2027-02-09"]', count: 1
    assert_select '#kurentovanje .festival-years dd', text: /Termin še ni objavljen/, count: 3

    get '/festivali/festival-idrijske-cipke/'
    assert_select '#festival-idrijske-cipke .festival-edition .festival-status', text: 'Pretekla izvedba'
    assert_select '#festival-idrijske-cipke .festival-edition time[datetime="2026-06-19"]', count: 1
    assert_select '#festival-idrijske-cipke .festival-edition time[datetime="2027-06-18"]', count: 1
    assert_select '#festival-idrijske-cipke .festival-edition a[download][href="/festivali/festival-idrijske-cipke/2027-06-18.ics"]', count: 1
    assert_select '#festival-idrijske-cipke .festival-edition a[download][href="/festivali/festival-idrijske-cipke/2026-06-19.ics"]', count: 0

    get '/festivali/fantazima-koper/'
    assert_select '#fantazima-koper time[datetime="2027-01-03"]', count: 1
    assert_select '#fantazima-koper time[datetime="2027-01-10"]', count: 0

    get '/festivali/alpski-vecer/2027-04-23.ics'
    assert_response :success
    assert_equal ['2027-04-23', '2027-04-24'], IcsService.import(response.body).sole.values_at('date', 'end_date')
    assert_includes SearchService.call('solinarski strunjan').map { |result| result.fetch(:path) }, '/festivali/solinarski-praznik/'
    assert_includes SearchService.call('kravji bal').map { |result| result.fetch(:path) }, '/festivali/kravji-bal/'
  end

  test 'an edition finishing in January remains discoverable and importable across calendar years' do
    get '/pomembni-dnevi/2027/', params: { category: 'festival', month: 1, q: 'Koper' }
    assert_response :success
    assert_select 'tbody a[href="/festivali/#fantazima-koper"]', count: 1

    get '/prazniki/2027.ics', params: { all: '1', category: 'festival', month: 1, q: 'Koper' }
    assert_response :success
    assert_equal ['2026-12-05', '2027-01-03'], IcsService.import(response.body).sole.values_at('date', 'end_date')
  end

  test 'the homepage calendar shows only statutory days off from the public catalog' do
    get '/', params: { year: 2026, month: 11 }
    assert_response :success
    assert_select '.calendar-panel .date-events a', count: 2
    assert_select '.calendar-panel td[data-date="2026-10-31"].holiday .event-label', count: 1
    assert_select '.calendar-panel td[data-date="2026-11-01"].holiday .event-label', count: 1

    %w[week day list].each do |view|
      get '/', params: { date: '2027-01-02', view: view }
      assert_response :success
      assert_select '.calendar-panel a[href="/festivali/#fantazima-koper"]', count: 0
      assert_select '.calendar-panel a[href="/prazniki/novo-leto/"]', minimum: 1
    end
  end

  test 'a festival is discoverable by location and downloads the entire verified date range' do
    get '/pomembni-dnevi/2027/', params: { category: 'festival', q: 'Ptuj' }
    assert_response :success
    assert_select 'tbody a[href="/festivali/#kurentovanje"]', count: 1
    assert_select 'tbody a[href="/prazniki/pust/"]', count: 0

    get '/festivali/kurentovanje/2027-02-03.ics'
    assert_response :success
    saved=IcsService.import(response.body).sole
    assert_equal ['2027-02-03', '2027-02-09'], saved.values_at('date', 'end_date')
    assert_includes saved.fetch('notes'), 'Ptuj'
    get '/festivali/kurentovanje/2028-02-03.ics'
    assert_response :not_found

    get '/prazniki/2027.ics', params: { all: '1', category: 'festival', q: 'Ptuj' }
    assert_response :success
    assert_equal ['2027-02-03', '2027-02-09'], IcsService.import(response.body).sole.values_at('date', 'end_date')
  end
end
