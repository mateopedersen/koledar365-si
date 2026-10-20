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
 test 'year and month pages contain their own complete gallery with direct period-specific files' do
  [[2027,nil],[2030,nil],[2027,2],[2028,2],[2030,12]].each do |year,month|
   path=month ? "/koledar/#{year}/#{CalendarEngine::MONTHS[month-1]}/" : "/koledar/#{year}/"
   get path
   assert_response :success
   assert_select '.calendar-download-callout a[href="#calendar-designs"]','Prikaži 15 predlog'
   assert_select '.panel .calendar',minimum:1
   assert_select '#calendar-designs[data-gallery-year="'+year.to_s+'"][data-gallery-type="'+(month ? 'monthly' : 'annual')+'"]' do
    assert_select '[data-calendar-design]',count:15
    assert_select 'img[src^="/prenosi/"]',count:15
    %w[pdf webp].each do |format|
     assert_select 'a[data-calendar-download="'+format+'"][download]',count:15 do |links|
      assert_equal 15,links.map { |a|a['href'] }.uniq.size
      links.each { |a|assert_includes a['href'],month ? "monthly-#{year}-#{'%02d' % month}-" : "annual-#{year}-" }
     end
    end
    assert_select 'a[href^="/koledar-za-tiskanje/"]',count:0
   end
   assert_operator response.body.index('class="panel"'),:<,response.body.index('id="calendar-designs"')
  end
 end
 test 'gallery download URLs serve real files and reject unknown artifacts' do
  row=PublicCalendarGallery.rows_for(year:2028,month:2).find { |r|r.dig('files','webp').end_with?('.zip') }
  get row.fetch('files').fetch('pdf')
  assert_response :success
  assert_equal 'application/pdf',response.media_type
  assert response.body.start_with?('%PDF-')
  get row.fetch('files').fetch('webp')
  assert_response :success
  assert_equal 'application/zip',response.media_type
  assert response.body.start_with?("PK")
  get '/prenosi/'+('0'*64)+'/unknown.pdf'
  assert_response :not_found
 end
end
