require 'test_helper'

class CalendarDirectoryTest < ActionDispatch::IntegrationTest
  test 'directory keeps every existing year and month destination in a chronological matrix' do
    get '/koledar/'
    assert_response :success
    assert_select 'h1', text:'Koledarji 2027–2030', count:1
    assert_select '.cd-period-table thead th', count:5
    assert_select '.cd-period-table tbody tr', count:13
    assert_select '.cd-period-table tbody a', count:52
    doc=Nokogiri::HTML(response.body)
    links=doc.css('.calendar-directory a').map{|a|a['href']}
    Page.where('path LIKE ?', '/koledar/%').where.not(path:'/koledar/').pluck(:path).each do |path|
      assert_includes links,path,"Existing calendar destination disappeared: #{path}"
    end
    assert_equal (0..12).to_a,doc.css('[data-directory-row]').map{|row|row['data-directory-row'].to_i}
    assert_select '[data-directory-column="2028"] small', text:/366 dni.*prestopno leto/
    assert_select 'script[type=module][src="/calendar-tools/directory.mjs"]',count:1
    assert_select '.cd-tool-table tbody tr',count:7
    assert_select '.cd-guide-years article', count: 4
    assert_select '.cd-guide a[href="https://www.gov.si/teme/drzavni-prazniki-in-dela-prosti-dnevi/"]', count: 1
  end

  test 'year page retains its calendar and downloads' do
    get '/koledar/2028/'
    assert_response :success
    assert_select '[data-calendar-directory]', count:0
    assert_select '.calendar-month-index__links a',count:12
    assert_select '#calendar-designs',minimum:1
  end

  test 'every calendar period has its own dated example and source' do
    periods = Page.where('path LIKE ?', '/koledar/%').where.not(year: nil).order(:path)
    titles = []
    collection_tips = []
    periods.each do |period|
      get period.path
      assert_response :success, period.path
      document = Nokogiri::HTML(response.body)
      if CalendarEngine::YEARS.include?(period.year)
        assert_select '.calendar-period-intro + #calendar-designs .calendar-design-card', count: 15
        assert_select '#calendar-designs img[loading="eager"]', count: 5
        assert_select '#calendar-designs a[data-calendar-download="pdf"][download]', count: 15
        assert_select '#calendar-designs a[data-calendar-download="webp"][download]', count: 15
        assert_select 'meta[name="description"][content*="15 brezplačnih predlog A3 za tiskanje"]', count: 1
        collection_tips << document.at_css('.calendar-collection-advice').text
      end
      example = document.at_css('.calendar-collection-example')
      refute_nil example, period.path
      titles << example.at_css('h2').text
      from, to = example.css('time').map { |node| node['datetime'] }
      first = Date.new(period.year, period.month || 1, 1)
      last = Date.new(period.year, period.month || 12, -1)
      assert_operator Date.iso8601(from), :<=, last
      assert_operator Date.iso8601(to), :>=, first
      assert_equal [from, to], URI.decode_www_form(URI.parse(example.at_css('a[href*="holidays=1"]')['href']).query).to_h.values_at('from', 'to')
      assert_select '#calendar-facts a[href="/viri-in-metodologija/"]', count: 1
    end
    assert_equal periods.size, titles.uniq.size
    assert_equal 52, collection_tips.uniq.size
  end
end
