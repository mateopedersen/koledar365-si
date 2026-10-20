require 'test_helper'
class CalendarNavigationTest < ActionDispatch::IntegrationTest
 test 'weekly navigation moves one ISO week across the year boundary' do
  get '/',params:{year:2027,month:1,date:'2027-01-01',view:'week'}
  assert_response :success
  assert_select '.calendar-title h2','Teden 53 · 2026'
  assert_select 'a[aria-label="Naslednji teden"]' do |links|
    assert_equal '2027-01-08',Rack::Utils.parse_query(URI(links.first['href']).query)['date']
  end
 end
 test 'daily navigation advances one day across leap day' do
  get '/',params:{year:2028,month:2,date:'2028-02-29',view:'day'}
  assert_select 'a[aria-label="Naslednji dan"]' do |links|
    assert_equal '2028-03-01',Rack::Utils.parse_query(URI(links.first['href']).query)['date']
  end
 end
end
