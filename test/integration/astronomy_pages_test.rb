require 'test_helper'

class AstronomyPagesTest < ActionDispatch::IntegrationTest
  test 'named moon pages render current year data once with real downloads and mobile diagrams' do
    travel_to Time.utc(2026, 10, 21, 12) do
      { '/polna-luna/' => 13, '/mlaj/' => 12, '/lunine-mene/' => 50 }.each do |path, count|
        get path
        assert_response :success
        assert_select 'h1', count: 1
        assert_select '[data-moon-rows] tr', count: count
        assert_select 'select[data-astro-year] option[selected][value="2026"]'
        assert_select 'script[src*="astronomy"][data-static-keep="true"]'
        assert_select 'picture source[media="(max-width:600px)"][srcset$="-mobile.webp"]'
        assert_select 'a[data-astro-ics][href$="2026.ics"]'
        assert_select '.gallery-intro', count: 0
      end
      get '/polna-luna/'
      assert_select '[data-next-date]', text: '26. oktobra 2026'
      assert_select '[data-next-time]', text: '05:12 CET'
    end
  end

  test 'eclipse pages render actual horizon information and source attribution without JavaScript' do
    get '/soncni-mrk/', params: { year: 2026, city: 'maribor' }
    assert_response :success
    assert_select 'h1', count: 1
    assert_select '[data-eclipse-rows] tr', count: 2
    assert_select '[data-detail-summary]', text: /Maksimum je pod obzorjem/
    assert_select '.astro-altitude-chart[role="img"]'
    assert_select '.astro-safety a[href="https://soncniblog.com/bliza-se-soncev-mrk/"]'
    get '/lunin-mrk/', params: { year: 2027 }
    assert_response :success
    assert_select '[data-detail-title]', text: '21. februarja 2027'
    assert_select '.astro-contact-date', minimum: 1
    assert_select '[data-detail-global]', text: /20\. februarja 2027/
  end

  test 'meteor nights have a truthful peak label and a selected city calendar' do
    get '/perzeidi/', params: { year: 2027, city: 'koper' }
    assert_response :success
    assert_select 'h1', count: 1
    assert_select '.astro-night', count: 3
    assert_select '.astro-purpose-note', text: /ne točna napoved maksimuma/
    assert_select '[data-astro-ics][href="/astronomy/perseids-2027-koper.ics"]'
    assert_select '.astro-night-heading strong', text: /Koper/, count: 3
  end
end
