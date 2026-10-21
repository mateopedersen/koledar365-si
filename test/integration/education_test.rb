require 'test_helper'

class EducationTest < ActionDispatch::IntegrationTest
  test 'all education pages render their own heading unique metadata real dates and primary sources' do
    travel_to Time.utc(2026, 10, 21, 12) do
      EducationCalendar.paths.each do |path|
        config = EducationCalendar.page(path)
        get path
        assert_response :success
        assert_select 'h1', text: config[:heading], count: 1
        assert_select 'title', text: "#{config[:title]} · Koledar365"
        assert_select 'meta[name="description"][content=?]', config[:description]
        assert_select 'link[rel="canonical"][href=?]', "https://koledar365.si#{path}"
        assert_select 'link[rel="stylesheet"][href="/education/experience.css"]', count: 1
        assert_select 'script[type="module"][src="/education/experience.mjs"]', count: 1
        assert_select '.ed-event', minimum: 1
        assert_select '.ed-sources time[datetime="2026-10-21"]'
        assert_select '.ed-sources a[href="/uredniska-politika/"]'
        calendar = EducationCalendar.new(path: path)
        calendar.sources.each { |source| assert_select '.ed-sources a[href=?]', source['url'] }
        payload = JSON.parse(css_select('#education-data').first.text)
        assert_equal path, payload['path']
        assert_equal config[:kind], payload['kind']
      end
    end
  end

  test 'school timetable has only lesson-specific fields and local export controls' do
    get '/solski-urnik/'
    assert_response :success
    assert_select 'h1', text: 'Moj šolski urnik', count: 1
    assert_select 'meta[name="description"][content=?]', EducationCalendar::TIMETABLE[:description]
    %w[subject day startTime endTime room teacher repeat date].each { |name| assert_select "[data-tt-lesson] [name=#{name}]", count: 1 }
    assert_select '[name=code]', count: 0
    assert_select '#planner-options', count: 0
    assert_select '[data-tt-print]', count: 1
    assert_select '[data-tt-ics]', count: 1
    assert_select '[data-tt-backup]', count: 1
    assert_select '[data-tt-import]', count: 1
    assert_select 'script[type="module"][src="/education/timetable.mjs"]', count: 1
    payload = JSON.parse(css_select('#timetable-data').first.text)
    assert payload['events'].all? { |e| %w[break holiday].include?(e['category']) }
  end

  test 'the existing holiday hub has a useful heading and links to the complete calendars' do
    get '/solske-pocitnice/'
    assert_response :success
    assert_select 'h1', text: 'Šolske počitnice 2026/2027 v Sloveniji', count: 1
    assert_select 'a[href="/solski-koledar/"]'
    assert_select 'a[href="/studijski-koledar/"]'
    assert_select '[data-university="unm"]', count: 1
  end
end
