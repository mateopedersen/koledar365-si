require 'test_helper'
class LunarCalendarTest < ActionDispatch::IntegrationTest
 test 'verified calendar has complete dates and preserves leap day and local DST' do
  assert LunarCalendar.validate!
  assert_equal 1461,LunarCalendar.days.size
  assert_equal 29,LunarCalendar.period(2028,2).size
  assert_equal 28,LunarCalendar.period(2027,2).size
  {'2027-03-27'=>60,'2027-03-28'=>120,'2028-10-28'=>120,'2028-10-29'=>60,'2030-03-31'=>120}.each do |date,offset|
   d=LunarCalendar.days.find { |r|r['date']==date };assert_equal offset,d['utcOffsetMinutes']
   assert_equal 12,Time.iso8601(d['localNoon']).hour
  end
  assert_equal 5,LunarCalendar.phases(2027,8).size
  last=LunarCalendar.days.last;assert_operator LunarCalendar.next_event(last)['utc'],:>,last['utc']
 end
 test 'lunar experience replaces only the dedicated lunar calendar and keeps all dates accessible' do
  get '/lunin-koledar/2028/februar/'
  assert_response :success
  assert_select '.lunar-day',count:29
  assert_select '.lunar-day[data-date="2028-02-29"][aria-label*="29. februarja 2028"]'
  assert_select '[data-lunar]'
  assert_select '.lunar-enlarge[aria-label]'
  assert_select 'dialog button[data-close]'
  assert_select 'a[href="/lunin-koledar/2028/marec/"]',minimum:1
  get '/lunin-koledar/2028/'
  assert_select '.lunar-mini-grid a',count:366
  get '/lunine-mene/'
  assert_response :success
  assert_select '[data-lunar]',count:0
 end
end
