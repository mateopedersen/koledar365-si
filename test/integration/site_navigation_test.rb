require 'test_helper'

class SiteNavigationTest < ActionDispatch::IntegrationTest
  test 'shared navigation preserves crawlable links and every destination resolves' do
    get '/'
    assert_response :success
    assert_select '.site-navigation .nav-years a', count: 4
    assert_select '.site-navigation .nav-shortcut', count: 3
    assert_select 'details[data-navigation-menu]:not([open]) summary[aria-controls=site-tools-menu]'
    assert_select '#site-tools-menu .nav-directory__group', count: ToolsDirectory::GROUPS.size
    assert_select '#site-tools-menu a[data-navigation-tool]', count: 66
    assert_select '#site-tools-menu a[href="/festivali/"]'
    assert_select '#site-tools-menu a[href="/ustvari-koledar/"]'
    assert_select '#site-tools-menu a[href="/nacrtovalnik-dopusta/"]'
    assert_select '#site-tools-menu a[href="/druzinski-planer/"]'
    assert_select '#site-tools-menu a[href="/razpored-izmen/"]'
    assert_select '#site-tools-menu a[href="/kalkulator-upokojitve/"]'
    assert_select '#site-tools-menu a[href="/vpisni-koledar/"]'
    assert_select '#site-tools-menu a[href="/lunin-vzhod-in-zahod/"]'
    doc = Nokogiri::HTML(response.body)
    destinations = doc.css('.topbar nav a, .site-navigation a').map { |link| link['href'] }
    tool_destinations = doc.css('#site-tools-menu a').map { |link| link['href'] }
    assert_equal tool_destinations.uniq, tool_destinations
    destinations.uniq.each do |destination|
      get destination
      assert_response :success, destination
      assert_select '.site-navigation', count: 1
      assert_select '[data-navigation-menu]', count: 1
    end
  end

  test 'current destination has an accessible current-page marker' do
    ['/koledar/2029/', '/delovni-dnevi/', '/setveni-koledar/', '/prazniki/'].each do |destination|
      get destination
      assert_response :success
      assert_select ".topbar nav a[href='#{destination}'][aria-current=page], .site-navigation a[href='#{destination}'][aria-current=page]", count: 1
    end
  end
end
