require 'test_helper'

class LocalToolsTest < ActionDispatch::IntegrationTest
  test 'the directory links each distinct tool and each new page has a useful heading and metadata' do
    get '/orodja/'
    assert_response :success
    assert_select 'h1', count: 1
    cards = css_select('[data-tool-card]').map { |card| card['href'] }
    assert_equal 52, cards.size
    assert_equal cards, cards.uniq
    assert_empty LocalTools::PAGES.keys - cards
    assert_empty LocalTools::PAGES.keys - Page.published.pluck(:path)
    LocalTools::PAGES.each_key do |path|
      get path
      assert_response :success
      assert_select 'h1', count: 1
      assert_select 'link[rel=canonical][href=?]', "https://koledar365.si#{path}"
    end
  end

  test 'flag days, admissions, and statutory dates use their source-backed ranges' do
    get '/dnevi-za-zastavo/'
    assert_response :success
    assert_select '[data-tool-row][data-year="2027"][data-category="required"]', count: 6
    assert_select '[data-tool-row][data-year="2027"][data-category="optional"][data-date="2027-08-07"]', count: 1
    get '/vpisni-koledar/'
    assert_response :success
    assert_select '[data-tool-row][data-category="srednja"][data-date="2027-04-05"]', count: 1
    assert_select '[data-tool-row][data-category="visja"][data-date="2027-02-18"][data-end="2027-03-18"]', count: 1
    assert_select '[data-tool-row][data-category="fakulteta"]', count: 0
    get '/davcni-koledar/'
    assert_response :success
    assert_select '[data-tool-row][data-category="najem"][data-date="2027-03-01"]', text: /premik na delovnik/
    get '/godovi/'
    assert_response :not_found
  end

  test 'countdown includes actual sourced festival and local day dates' do
    events = CountdownCatalog.events(today: Date.new(2026, 11, 22))
    assert events.any? { |row| row[:path] == '/festivali/#kurentovanje' && row[:date] == '2027-02-03' && row[:end_date] == '2027-02-09' }
    assert events.any? { |row| row[:path] == '/pomembni-dnevi/praznik-ptuja/' && row[:date] == '2027-04-23' }
    refute events.any? { |row| row[:path] == '/festivali/#eurobasket-ljubljana-2029' }
  end
end
