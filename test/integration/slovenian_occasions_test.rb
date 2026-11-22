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
    assert_select '#kurentovanje time[datetime="2027-02-03"]', count: 1
    assert_select '#kurentovanje time[datetime="2027-02-09"]', count: 1
    assert_select '#kurentovanje .festival-years dd', text: /Termin še ni objavljen/, count: 3
    assert_select '#festival-idrijske-cipke .festival-edition', count: 0
    assert_select '#fantazima-koper time[datetime="2027-01-03"]', count: 1
    assert_select '#fantazima-koper time[datetime="2027-01-10"]', count: 0
  end

  test 'an edition finishing in January is visible and importable in both calendar years' do
    get '/pomembni-dnevi/2027/', params: { category: 'festival', month: 1, q: 'Koper' }
    assert_response :success
    assert_select 'tbody a[href="/festivali/#fantazima-koper"]', count: 1

    get '/', params: { date: '2027-01-02', view: 'day' }
    assert_response :success
    assert_select '.week-view a[href="/festivali/#fantazima-koper"]', count: 1

    get '/prazniki/2027.ics', params: { all: '1', category: 'festival', month: 1, q: 'Koper' }
    assert_response :success
    assert_equal ['2026-12-05', '2027-01-03'], IcsService.import(response.body).sole.values_at('date', 'end_date')
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
