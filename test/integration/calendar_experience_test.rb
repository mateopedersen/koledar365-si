require 'test_helper'

class CalendarExperienceTest < ActionDispatch::IntegrationTest
  test 'home print and editor options retain the selected 2026 period' do
    get '/',params:{year:2026,month:10,date:'2026-10-21'}
    assert_response :success
    assert_select '[data-selected-calendar-download]' do |links|
      values=Rack::Utils.parse_query(URI(links.first['href']).query)
      assert_equal({'year'=>'2026','month'=>'10','date'=>'2026-10-21','type'=>'monthly'},values)
    end
    assert_select '[data-selected-calendar-editor]' do |links|
      values=Rack::Utils.parse_query(URI(links.first['href']).query)
      assert_equal({'year'=>'2026','month'=>'10','view'=>'month'},values)
    end
    get '/koledar-za-tiskanje/',params:{year:2026,month:10,date:'2026-10-21',type:'monthly'}
    assert_response :success
    assert_select '#planner-options select[name=year] option[selected]','2026'
    assert_select '#planner-options input[name=date][value="2026-10-21"]'
    assert_select '[data-export-options]' do |sections|
      values=JSON.parse(sections.first['data-export-options'])
      assert_equal 2026,values['year']
      assert_equal 10,values['month']
      assert_equal '2026-10-21',values['date']
    end
    assert_select 'img[data-preview-design][src^="/predogled/2026/"]',count:15
  end

  test 'monthly hub provides direct months an actual calendar and real Excel control' do
    get '/mesecni-koledar/',params:{year:2028,month:2}
    assert_response :success
    assert_select '[data-calendar-experience="monthly"][data-initial-year="2028"][data-initial-month="2"]'
    assert_select '[data-calendar-month]',count:12
    assert_select 'main h1', count: 1, text: 'Mesečni koledar za tiskanje: PDF in Excel'
    assert_select 'meta[name="description"][content*="od 2026 do 2030"]', count: 1
    assert_select 'link[rel="canonical"][href="https://koledar365.si/mesecni-koledar/"]', count: 1
    assert_select '.calendar-sheet__holidays time[datetime="2028-02-08"]', count: 1
    assert_select '#uporaba-mesecnega-koledarja a[href="https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/"]', count: 1
    assert_select 'a[data-calendar-month="2"][href="/koledar/2028/februar/"]'
    assert_select '[data-calendar-sheet] table.calendar td[data-date="2028-02-29"]'
    assert_select '[data-calendar-layout]',count:3
    assert_select '[data-calendar-xlsx]'
    get '/koledar/2028/februar/'
    assert_select '[data-calendar-spreadsheet][data-year="2028"][data-month="2"] [data-calendar-xlsx]'
    get '/koledar/2027/'
    assert_select '[data-calendar-spreadsheet][data-year="2027"][data-month=""] [data-calendar-xlsx]'
  end

  test 'weekly hub shows ISO year boundary and correct weekly destination links' do
    get '/tedenski-koledar/',params:{date:'2027-01-01'}
    assert_response :success
    assert_select '[data-calendar-kicker]','TEDEN 53 / 2026'
    assert_select '[data-day-notes="2026-12-28"]'
    assert_select '[data-day-notes="2027-01-03"]'
    assert_select 'a[data-calendar-year="2028"][href="/tedenski-koledar/2028/"]'
    assert_select '[data-week-number][value="53"][max="53"]'
    assert_select '[data-calendar-pdf]'
    get '/tedenski-koledar/2028/'
    assert_select '[data-calendar-experience="weekly"]'
    assert_select '[data-export-options] .design-card',count:15
  end

  test 'weekly hub renders dated public holidays and keeps the two selectors independent' do
    get '/tedenski-koledar/', params: { date: '2030-12-31' }
    assert_response :success
    assert_select 'form[data-week-date-selection] input[name="date"][value="2030-12-31"]'
    assert_select 'form[data-week-date-selection] select[name="year"]', count: 0
    assert_select 'form[data-week-selection] input[name="date"]', count: 0
    assert_select '[data-calendar-kicker]', 'TEDEN 1 / 2031'
    assert_select '.is-holiday time[datetime="2031-01-01"]'
    assert_select '.is-holiday time[datetime="2031-01-02"]'
    assert_select 'main h1', count: 1
    assert_select '#tedenski-vodic a[href="https://unicode.org/reports/tr35/tr35-dates.html#Date_Patterns_Week_Of_Year"]'
    get '/tedenski-koledar/', params: { year: 2026, week: 53 }
    assert_select '[data-calendar-kicker]', 'TEDEN 53 / 2026'
  end

  test 'each weekly year introduces a different verifiable planning example' do
    {
      2026 => ['2026-04-06', 'TEDEN 15 / 2026'],
      2027 => ['2027-06-25', 'TEDEN 25 / 2027'],
      2028 => ['2028-08-15', 'TEDEN 33 / 2028'],
      2029 => ['2029-10-31', 'TEDEN 44 / 2029'],
      2030 => ['2030-12-31', 'TEDEN 1 / 2031']
    }.each do |year, (date, iso_week)|
      path = "/tedenski-koledar/#{year}/"
      get path, params: { date: date }
      assert_response :success
      assert_select '.weekly-guide__example a[href=?]', "#{path}?date=#{date}#tedenski-nacrt", count: 1
      assert_select 'link[rel="canonical"][href=?]', "https://koledar365.si#{path}", count: 1
      assert_select '[data-calendar-kicker]', iso_week
    end
  end

  test 'workday calculator supports the complete current year and backward year transition' do
    get '/kalkulator-delovnih-dni/'
    assert_select '[data-wdc-form="range"] input[name=from][min="2026-01-01"]'
    get '/datumski-kalkulator/'
    assert_select '[data-work-from][min="2026-01-01"]'
    post '/izracun/',params:{tool:'workdays',from:'2026-01-01',to:'2026-12-31',hours:8,weekdays:%w[1 2 3 4 5],exclude_holidays:'1',include_start:'1',include_end:'1'},as: :json
    assert_response :success
    assert_equal 254,response.parsed_body.dig('workdays','working_days')
    post '/izracun/',params:{tool:'workday_shift',from:'2027-01-04',delta:-1,weekdays:%w[1 2 3 4 5],exclude_holidays:'1'},as: :json
    assert_response :success
    assert_equal '2026-12-31',response.parsed_body.dig('workday_shift','target_date')
    post '/izracun/',params:{tool:'workday_shift',from:'2026-01-01',delta:-1,weekdays:%w[1 2 3 4 5],exclude_holidays:'1'},as: :json
    assert_response :unprocessable_entity
  end
end
