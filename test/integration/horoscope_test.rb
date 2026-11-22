require 'test_helper'
class HoroscopeTest < ActionDispatch::IntegrationTest
  test 'all horoscope routes expose an accessible private calculator and real canonical' do
    routes=['/horoskop/','/horoskop/izracun-znamenja/']+Zodiac::SIGNS.keys.map { |slug|"/horoskop/#{slug}/" }
    day=Date.iso8601(JSON.parse(Rails.root.join('public/horoscope/daily.json').read).fetch('local_date'))
    travel_to Time.zone.local(day.year,day.month,day.day,15) do
      routes.each do |path|
        get path
        assert_response :success
        assert_select 'h1',count:1
        assert_select "link[rel=canonical][href='https://koledar365.si#{path}']",count:1
        assert_select "[data-horoscope-app][data-edition-day='#{day.iso8601}']",count:1
        assert_select '[data-birth-form]',count:1
        assert_select '[data-birth-fields][disabled]',count:1
        assert_select '[data-birth-form] input[name]',count:0
        assert_select '[data-birth-form] select[name]',count:0
        assert_select 'script[src="/horoscope/experience-v2.mjs"][type=module]',count:1
        assert_select 'script#zodiac-profiles' do |nodes|
          assert_equal 12,JSON.parse(nodes.first.text).size
        end
      end
    end
  end
  test 'sign pages contain four complete dated sections and calculated solar boundaries' do
    assert_equal Zodiac::SIGNS.keys.sort, HoroscopeGuide::SIGN_EDITORIAL.keys.sort

    Zodiac::SIGNS.each do |slug, label|
      editorial = HoroscopeGuide::SIGN_EDITORIAL.fetch(slug)
      get "/horoskop/#{slug}/"
      assert_select 'h1', text: "Dnevni horoskop za #{editorial.fetch('accusative')}"
      assert_select 'title', text: "#{label} – dnevni horoskop za danes | Koledar365"
      assert_select 'meta[name="description"]' do |nodes|
        assert_equal editorial.fetch('description'), nodes.first['content']
      end
      assert_select '.z-sign-editorial > p', count: 2
      assert_select '#dnevni-zapis [data-edition-date]', count: 1
      assert_select '[data-moon-sign]', count: 1
      assert_select '[data-reading-field]',count:6
      assert_select '[data-reading-field=overview]' do |nodes| assert_operator nodes.first.text.length,:>,180 end
      assert_select ".z-hero-art img[src='/horoscope/art/#{slug}-v1.svg']",count:1
      assert_select '.z-season time[datetime]',count:2
      assert_select ".z-sign-nav a[aria-current=page][href='/horoskop/#{slug}/']",count:1
    end
  end
  test 'hub includes all sign dates and the homepage uses the new zodiac navigation' do
    get '/horoskop/'
    assert_select '[data-sign-card]',count:12
    assert_select '.z-card-date',count:12
    get '/'
    assert_select '.subnav a[href="/horoskop/"] strong',text:'Dnevni horoskop'
    assert_select '.subnav a[href="/horoskop/"] .tool-directory-icon use' do |icons|
      assert_match %r{\A/visuals/ui-material-v3\.[a-f0-9]{16}\.svg#tool-art-daily-horoscope\z}, icons.first['href']
    end
    assert_select '.home-zodiac-link[href="/horoskop/"]'
  end
  test 'an old edition remains dated instead of being relabeled as today' do
    day=Date.iso8601(JSON.parse(Rails.root.join('public/horoscope/daily.json').read).fetch('local_date'))
    travel_to Time.zone.local(day.year,day.month,day.day,12)+1.day do
      get '/horoskop/dvojcka/'
      assert_select "[data-edition-day='#{day.iso8601}']",count:1
      assert_select '[data-edition-status]',text:'Zadnja pripravljena izdaja'
      refute HoroscopeGuide.new(day+1,'dvojcka').current?
    end
  end
end
