require 'test_helper'
class CalendarNavigationTest < ActionDispatch::IntegrationTest
 test 'home calendar keeps date and period consistent and bounds the supported years' do
  get '/',params:{year:2027,month:1,date:'2028-02-29',view:'day'}
  assert_select '#personal-planner[data-selected-date="2028-02-29"]'
  assert_select '.period-form select[name=year] option[selected]','2028'
  get '/',params:{year:2030,month:12,date:'2030-12-31',view:'day'}
  assert_select 'a[aria-label="Naslednji dan"]',count:0
  get '/',params:{year:2026,month:1,view:'year'}
  assert_select '.year-grid table',count:3
  assert_select '#personal-planner[data-selected-date^="2026-10-"]'
 end
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
 test 'annual and monthly pages expose their matching PDF and WebP designs above the calendar' do
  get '/koledar/2027/'
  assert_response :success
  assert_select '.calendar-download-callout' do
   assert_select 'h2#calendar-download-title','Letni koledar 2027 za tisk'
   assert_select 'a[href^="/koledar-za-tiskanje/"]',text:'Prikaži predloge' do |links|
    assert_equal({'date'=>'2027-01-01','month'=>'1','type'=>'annual','year'=>'2027'},Rack::Utils.parse_query(URI(links.first['href']).query))
   end
   assert_select '.eyebrow','15 PREDLOG · PDF + WEBP · 600 PPI'
  end
  get '/koledar/2027/februar/'
  assert_response :success
  assert_select '.calendar-download-callout' do
   assert_select 'h2#calendar-download-title','Koledar za februar 2027 za tisk'
   assert_select 'a[href^="/koledar-za-tiskanje/"]',text:'Prikaži predloge' do |links|
    assert_equal({'date'=>'2027-02-01','month'=>'2','type'=>'monthly','year'=>'2027'},Rack::Utils.parse_query(URI(links.first['href']).query))
   end
  end
 end
end
