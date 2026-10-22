require 'test_helper'

class HolidaysTest < ActionDispatch::IntegrationTest
  test 'all four annual holiday pages show correct independent totals and 23 dates' do
    {2027 => [6,9,255,'2027-03-28'],2028 => [10,5,250,'2028-04-16'],
     2029 => [13,2,248,'2029-04-01'],2030 => [12,3,249,'2030-04-21']}.each do |year,(weekdays,weekends,working,easter)|
      get "/prazniki/#{year}/"
      assert_response :success
      assert_select 'h1',count:1
      assert_select '.holiday-years a[aria-current]',text:year.to_s
      assert_select '[data-holiday-row]:not([hidden])',count:23
      assert_select '[data-holiday-row][data-free=true]',count:15
      assert_select '.holiday-facts dd',count:4
      period=HolidayYear.new(year)
      assert_equal weekdays,period.weekday_free_dates.size
      assert_equal weekends,period.weekend_free_dates.size
      assert_equal working,period.working_days
      assert_equal 17,period.events.count(&:state_holiday)
      assert_equal 6,period.events.count { |event| !event.state_holiday }
      assert_equal Date.iso8601(easter),period.events.find { |e|e.title=='velikonočna nedelja' }.on
      assert_equal Date.iso8601(easter)+49,period.events.find { |e|e.slug=='binkosti' }.on
      assert_select ".holiday-date[datetime='#{year}-08-07']"
      assert_select '.design-card',count:15
      assert_select "[data-export-options*='holidays']",count:1
    end
  end

  test 'HTML filters and ICS use the same dates and holiday flags' do
    (2027..2030).each do |year|
      %w[all free working].product([0,2,7,8,11]).each do |kind,month|
        selected=HolidayYear.new(year).filter(kind:kind,month:month)
        get "/prazniki/#{year}/",params:{kind:kind,month:month}
        assert_response :success
        doc=Nokogiri::HTML(response.body)
        assert_equal selected.map { |e|e.on.iso8601 },doc.css('[data-holiday-row]:not([hidden]) time').map { |el|el['datetime'] }
        get "/prazniki/#{year}.ics",params:{kind:kind,month:month}
        assert_response :success
        assert_includes response.media_type,'text/calendar'
        events=IcsService.import(response.body)
        assert_equal selected.map { |e|e.on.iso8601 },events.map { |e|e['date'] }
        assert events.all? { |event|event['notes'].include?('pisrs.si') }
      end
    end
  end

  test 'accent insensitive search and single event export preserve the exact title' do
    get '/prazniki/2028/',params:{q:'presernov'}
    assert_select '[data-holiday-row]:not([hidden])',count:1
    assert_select '[data-holiday-row]:not([hidden]) .holiday-name',text:'Prešernov dan, slovenski kulturni praznik'
    event=CalendarEvent.find_by!(slug:'dan-triglava',on:Date.new(2029,8,7))
    get '/prazniki/2029.ics',params:{event:event.key}
    rows=IcsService.import(response.body)
    assert_equal 1,rows.size
    assert_equal event.title,rows.first['title']
    assert_equal '2029-08-07',rows.first['date']
    assert_includes rows.first['notes'],'Ni dela prost dan'
    get '/prazniki/2028.ics',params:{event:event.key}
    assert_response :not_found
    get '/prazniki/',params:{year:2026}
    assert_response :success
    assert_select '[data-holiday-directory]'
    assert_select '[data-holiday-row]',count:0
    (2027..2030).each { |year| assert_select "a[href='/prazniki/#{year}/']" }
  end

  test 'break suggestions never overlap and show every charged leave date' do
    (2027..2030).each do |year|
      period=HolidayYear.new(year)
      options=period.breaks
      assert options.any?
      options.each do |option|
        assert_equal option[:leave],option[:leave_dates].size
        assert_operator option[:leave],:<=,1
        assert_equal option[:total],(option[:to]-option[:from]).to_i+1
        assert option[:leave_dates].all? { |date|date.cwday<=5&&!period.free_dates.include?(date) }
      end
      assert options.combination(2).all? { |a,b|a[:to]<b[:from]||b[:to]<a[:from] }
    end
  end
end
