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
  assert_select '.lunar-day#dan-2028-02-29[data-date="2028-02-29"][aria-label*="29. februarja 2028"]'
  assert_select '[data-lunar]'
  assert_select '.lunar-enlarge[aria-label]'
  assert_select 'dialog button[data-close]'
  assert_select '.lunar-download-hint a[href="#prenosi"]',count:1
  assert_select '.lunar-downloads#prenosi',count:1
  assert_select 'a[href="/lunin-koledar/2028/marec/"]',minimum:1
  get '/lunin-koledar/2028/'
  assert_select '.lunar-mini-grid a',count:366
  get '/lunine-mene/'
  assert_response :success
  assert_select '[data-lunar]',count:0
 end
 test 'lunar hub presents authentic NASA Moon photographs and all month routes' do
  get '/lunin-koledar/'
  assert_response :success
  assert_select '.lunar-hub-masthead h1',count:1
  assert_select ".lunar-hub-masthead__art img[src='/lunar/photos/artemis-earthset.jpg'][alt='']",count:1
  assert_select '.lunar-hub-masthead__art svg',count:0
  assert_select '.lunar-year-card',count:4
  photos={2027=>'artemis-curve.jpg',2028=>'artemis-earthset.jpg',2029=>'apollo-17-moon.jpg',2030=>'apollo-8-lunar-surface.jpg'}
  photos.each do |year,photo|
   assert_select ".lunar-year-card--#{year} .lunar-year-art img[src='/lunar/photos/#{photo}'][alt]",count:1
   assert_select ".lunar-year-card--#{year} .lunar-year-art svg",count:0
   assert_select ".lunar-year-card--#{year} nav[aria-label='Meseci leta #{year}'] a",count:12
   assert_select ".lunar-year-card--#{year} a[href='/lunin-koledar/#{year}/']",minimum:1
  end
  assert_select "a[href='/lunin-koledar/2027/januar/']" do |links|
   assert_equal '01Januar',links.first.text.strip.gsub(/\s+/, '')
  end
  assert_select "a[href='https://images.nasa.gov/details/art002e020904']",minimum:1
  assert_select '.lunar-hub-method',count:1
  assert_select '.lunar-phases',count:0
  assert_select '.lunar-downloads',count:0
  get '/lunin-koledar/2028/'
  assert_response :success
  assert_select '.lunar-hub',count:0
  assert_select '.lunar-download-hint a[href="#prenosi"]',count:1
  assert_select '.lunar-downloads',minimum:1
 end
end
