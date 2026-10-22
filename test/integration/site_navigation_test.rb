require 'test_helper'

class SiteNavigationTest < ActionDispatch::IntegrationTest
  test 'shared navigation preserves crawlable links and every destination resolves' do
    get '/'
    assert_response :success
    assert_select '.site-navigation .nav-years a', count: 4
    assert_select '.site-navigation .nav-shortcut', count: 3
    assert_select 'details[data-navigation-menu]:not([open]) summary[aria-controls=site-tools-menu]'
    assert_select '#site-tools-menu .nav-directory__group', count: 3
    assert_select '#site-tools-menu .nav-directory__group a', count: 12
    assert_select '#site-tools-menu a[href="/ustvari-koledar/"]'
    assert_select '#site-tools-menu a[href="/nacrtovalnik-dopusta/"]'
    assert_select '#site-tools-menu a[href="/druzinski-planer/"]'
    assert_select '#site-tools-menu a[href="/razpored-izmen/"]'
    doc = Nokogiri::HTML(response.body)
    destinations = doc.css('.topbar nav a, .site-navigation a').map { |link| link['href'] }
    assert_equal destinations.uniq, destinations
    destinations.each do |destination|
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
