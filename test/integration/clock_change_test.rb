require 'test_helper'

class ClockChangeTest < ActionDispatch::IntegrationTest
  test 'Slovenian dates match both official Commission schedules' do
    expected=%w[2026-03-29 2026-10-25 2027-03-28 2027-10-31 2028-03-26 2028-10-29 2029-03-25 2029-10-28 2030-03-31 2030-10-27]
    changes=ClockChangeSchedule.transitions
    assert_equal expected,changes.map { |row|row[:date].iso8601 }
    changes.each do |row|
      assert row[:date].sunday?
      before=(row[:instant]-1).in_time_zone('Europe/Ljubljana')
      after=row[:instant].in_time_zone('Europe/Ljubljana')
      assert_equal row[:date].month==3 ? '01:59:59' : '02:59:59',before.strftime('%H:%M:%S')
      assert_equal row[:after],after.strftime('%H:%M')
      assert_equal row[:date].month==3 ? 3600 : -3600,after.utc_offset-before.utc_offset
    end
  end

  test 'next change rolls forward at the transition instant and ends at the verified range' do
    schedule=ClockChangeSchedule.new
    assert_equal '2026-10-25',schedule.next_change(at:Time.utc(2026,10,21))[:date].iso8601
    assert_equal '2026-10-25',schedule.next_change(at:Time.utc(2026,10,25,0,59,59))[:date].iso8601
    assert_equal '2027-03-28',schedule.next_change(at:Time.utc(2026,10,25,1))[:date].iso8601
    assert_equal '2027-10-31',schedule.next_change(at:Time.utc(2027,3,28,1))[:date].iso8601
    assert_nil schedule.next_change(at:Time.utc(2030,10,27,1))
  end

  test 'clock page exposes complete metadata dates and crawlable original image' do
    travel_to Time.utc(2026,10,21,12) do
      get '/premik-ure/'
      assert_response :success
      assert_select 'h1',text:'Premik ure v Sloveniji',count:1
      assert_select 'title',text:"#{ClockChangeSchedule::TITLE} · Koledar365"
      assert_select 'meta[name="description"][content=?]',ClockChangeSchedule::DESCRIPTION
      assert_select 'meta[property="og:description"][content=?]',ClockChangeSchedule::DESCRIPTION
      assert_select '[data-next-date][datetime="2026-10-25"]'
      assert_select '[data-next-hours]',text:'03:00 → 02:00'
      assert_select '.observance-year-card',count:5
      assert_select '[data-observance-date]',count:10
      assert_select '.clock-change-figure img[src=?][alt=?]',ClockChangeSchedule::IMAGE_PATH,ClockChangeSchedule::IMAGE_ALT
      assert_select 'meta[property="og:image"][content=?]',"https://koledar365.si#{ClockChangeSchedule::IMAGE_PATH}"
      assert_select 'script[type="module"][src="/premik-ure/experience.mjs"]',count:1
      graph=JSON.parse(css_select('script[type="application/ld+json"]').first.text).fetch('@graph')
      image=graph.find { |row|row['@type']=='ImageObject' && row['creditText']=='Koledar365' }
      assert_equal "https://koledar365.si#{ClockChangeSchedule::IMAGE_PATH}",image.fetch('contentUrl')
      assert_equal({'@id'=>image.fetch('@id')},graph.find { |row|row['@type']=='WebPage' }.fetch('primaryImageOfPage'))
      ClockChangeSchedule::SOURCES.each { |_,url|assert_select '.observance-sources a[href=?]',url }
    end
  end

  test 'published page includes its infographic in the image sitemap' do
    Page.find_by!(path:'/premik-ure/').update!(status:'published')
    get '/sitemap-pages.xml'
    assert_response :success
    xml=Nokogiri::XML(response.body)
    image=xml.at_xpath('//s:url[s:loc="https://koledar365.si/premik-ure/"]/image:image/image:loc',
      's'=>'http://www.sitemaps.org/schemas/sitemap/0.9','image'=>'http://www.google.com/schemas/sitemap-image/1.1')
    assert_equal "https://koledar365.si#{ClockChangeSchedule::IMAGE_PATH}",image&.text
  end

  test '2026 calendar download contains both verified all day transitions' do
    calendar=Rails.root.join('public/premik-ure/premik-ure-2026.ics').binread
    assert_equal calendar.scan(/\n/).length,calendar.scan(/\r\n/).length
    assert calendar.split("\r\n").all? { |line|line.bytesize<=75 }
    events=IcsService.import(calendar.force_encoding('UTF-8'))
    assert_equal ['2026-03-29','2026-10-25'],events.map { |row|row['date'] }
    assert events.all? { |row|row['time'].empty? }
  end
end
