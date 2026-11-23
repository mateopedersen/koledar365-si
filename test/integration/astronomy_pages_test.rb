require 'test_helper'

class AstronomyPagesTest < ActionDispatch::IntegrationTest
  test 'astronomy calendar distinguishes global eclipse times from local observations' do
    get SlovenianSkyCalendar::PATH
    assert_response :success
    assert_select 'h1', text: 'Astronomski koledar 2026–2030 za Slovenijo'
    assert_select '[data-sl-sky-group]', count: 5
    assert_select '[data-sl-sky-row]', count: SlovenianSkyCalendar.events.size
    assert_select '[data-sl-sky-group="2030"] [data-sl-sky-month-group="9"] [data-sl-sky-row="season"]' do
      assert_select 'time[datetime="2030-09-23T01:27:00+02:00"]'
      assert_select '.sky-row__time', text: '01:27 CEST'
    end
    assert_select '[data-sl-sky-group="2027"] [data-sl-sky-month-group="8"] [data-sl-sky-row="eclipse"]', text: /Popolni Sončev mrk.*?12:07 CEST/m
    assert_select '.sky-example dd', text: '11:15'
    assert_select 'meta[property="og:image"][content$="artemis-curve.jpg"]'

    get '/soncni-mrk/', params: { year: '2027', city: 'ljubljana', event: 'solar-2027-02-06' }
    assert_response :success
    assert_select '[data-astro-event] option[selected][value="solar-2027-02-06"]'
  end
  test 'moon pages render current year data and real downloads with responsive artwork' do
    travel_to Time.utc(2026, 10, 21, 12) do
      { '/polna-luna/' => 13, '/mlaj/' => 12, '/lunine-mene/' => 50 }.each do |path, count|
        get path
        assert_response :success
        assert_select 'h1', count: 1
        assert_select '[data-moon-rows] tr', count: count
        assert_select 'select[data-astro-year] option[selected][value="2026"]'
        assert_select 'script[src*="astronomy"][data-static-keep="true"]'
        if path == LunarPhaseGuide::PATH
          assert_select '.moon-phase-card', count: 8
          assert_select '.moon-phase-card img[alt]', count: 7
          assert_select '.moon-phase-card#mlaj img', count: 0
          assert_select '.moon-masthead img[srcset*="-640.webp"]'
          assert_select 'meta[property="og:image"][content$="luna-nad-piranom-1280.webp"]'
          assert_select 'time[datetime="2026-06-29T23:56:00Z"]', text: '30. junija 2026'
        elsif path == LunarPhaseGuide::NEW_MOON_PATH
          assert_select '.moon-masthead img[alt][src$="mlaj-zemljin-sij-iss-1280.webp"]'
          assert_select '.new-moon-guide__photo img[alt][src$="mlaj-lunin-srp-paranal-960.webp"]'
          assert_select '.new-moon-geometry svg[role=img][aria-labelledby]'
          assert_select 'meta[property="og:image"][content$="mlaj-zemljin-sij-iss-1280.webp"]'
        else
          assert_select 'picture source[media="(max-width:600px)"][srcset$="-mobile.webp"]'
        end
        assert_select 'a[data-astro-ics][href$="2026.ics"]'
        assert_select '.gallery-intro', count: 0
      end
      get '/polna-luna/'
      assert_select '[data-next-date]', text: '26. oktobra 2026'
      assert_select '[data-next-time]', text: '05:12 CET'
    end
  end

  test 'moon phase photograph credits disclose the source, photographer and license' do
    get '/fotografije-in-licence/'
    assert_response :success
    assert_select '#fotografije-luninih-men li', count: 8
    LunarPhaseGuide.photos.each do |id, photo|
      assert_select "li#luna-#{id}" do
        assert_select 'bdi', text: photo.fetch('credit')
        assert_select 'a[href=?]', photo.fetch('source')
        assert_select 'a[href=?]', photo.fetch('license_url')
      end
    end
    assert_select '#fotografije-mlaja li', count: 2
    LunarPhaseGuide.new_moon_photos.each do |id, photo|
      assert_select "li#luna-#{id}" do |items|
        assert_includes items.first.text, photo.fetch('credit')
        assert_select 'a[href=?]', photo.fetch('source')
        assert_select 'a[href=?]', photo.fetch('license_url')
      end
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
