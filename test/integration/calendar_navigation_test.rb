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
   assert_select '.download-workspace > .calendar-context [data-context-expand][aria-expanded=false]'
   assert_select '.context-actions a[href="#calendar-designs"]','15 predlog za prenos'
   assert_select '.panel .calendar',minimum:1
   expected=PublicCalendarGallery.rows_for(year:year,month:month)
   assert_select '#calendar-designs[data-gallery-year="'+year.to_s+'"][data-gallery-type="'+(month ? 'monthly' : 'annual')+'"]' do
    assert_select '[data-calendar-design]',count:15
    assert_select 'img[src^="/koledarji/2027-2030/preview/"]',count:15 do |images|
     assert_equal expected.map { |row|row.dig('files','preview') }.sort,images.map { |image|image['src'] }.sort
     assert images.all? { |image|image['alt'].present?&&image['title'].present? }
    end
    %w[pdf webp].each do |format|
     assert_select 'a[data-calendar-download="'+format+'"][download]',count:15 do |links|
      assert_equal 15,links.map { |a|a['href'] }.uniq.size
      assert_equal expected.map { |row|row.dig('files',format) }.sort,links.map { |a|a['href'] }.sort
      links.each { |a|assert_includes a['href'],"/original/#{year}/";assert a['href'].end_with?(format=='pdf' ? '.pdf' : '.webp') }
     end
    end
    assert_select '.calendar-design-meta',text:/A3.*600 dpi/,count:15
    assert_select 'a[href^="/koledar-za-tiskanje/"]',count:0
   end
   assert_operator response.body.index('class="panel gallery-context'),:<,response.body.index('id="calendar-designs"')
  end
 end
 test 'all gallery families put controls beside an open complete gallery' do
  ['/prazen-koledar/','/tedenski-koledar/2028/','/delovni-dnevi/2028/','/prazniki/2028/'].each do |path|
   get path
   assert_response :success
   assert_select 'body.gallery-page'
   assert_select '.page-heading p',text:ApplicationController.helpers.gallery_description
   assert_select '.download-workspace > .gallery-context #gallery-context-content'
   assert_select '.download-workspace [data-context-expand][aria-controls=gallery-context-content]'
   assert_select '.download-workspace .design-section .design-card',count:15
   assert_select 'details .design-section',count:0
   assert_select '#planner-options' do
    assert_select 'details.planner-advanced:not([open])'
   end if path=='/prazen-koledar/'
  end
 end
 test 'calendar galleries separate design numbers and names and label distinct file icons' do
  get '/koledar/2027/februar/'
  assert_response :success
  assert_select '.calendar-design-info h3 .design-number[aria-hidden=true]',count:15
  assert_select '.calendar-design-info h3 .design-title',count:15
  assert_select '.calendar-design-downloads .calendar-download-action--pdf img[src="/visuals/download-pdf-v1.svg"][alt=""]',count:15
  assert_select '.calendar-design-downloads .calendar-download-action--webp img[src="/visuals/download-webp-v1.svg"][alt=""]',count:15
  assert_select '.calendar-design-downloads .calendar-download-action__copy strong','PDF'
  assert_select '.calendar-design-downloads .calendar-download-action__copy small','Prenesi'

  get '/koledar-za-tiskanje/'
  assert_response :success
  assert_select '.design-card h3 .design-number[aria-hidden=true]',count:15
  assert_select '.design-card h3 .design-title',count:15
  assert_select '.design-card .calendar-download-action--pdf img[src="/visuals/download-pdf-v1.svg"][alt=""]',count:15
  assert_select '.design-card .calendar-download-action--webp img[src="/visuals/download-webp-v1.svg"][alt=""]',count:15
  assert_select '.design-card .calendar-download-action__copy strong','PDF'
  assert_select '.design-card .calendar-download-action__copy small','Prenesi'
 end
 test 'gallery download URLs serve real files and reject unknown artifacts' do
  row=PublicCalendarGallery.rows_for(year:2028,month:2).first
  pdf=PublicCalendarGallery.public_file(row.dig('files','pdf'))
  webp=PublicCalendarGallery.public_file(row.dig('files','webp'))
  assert_equal 'application/pdf',Rack::Mime.mime_type('.pdf')
  assert_equal 'image/webp',Rack::Mime.mime_type('.webp')
  assert pdf.file? && pdf.binread(5)=='%PDF-'
  header=webp.binread(12)
  assert webp.file? && header.start_with?('RIFF') && header.byteslice(8,4)=='WEBP'
  assert_equal 'A3',row.dig('options','paper')
  get '/prenosi/'+('0'*64)+'/unknown.pdf'
  assert_response :not_found
 end
end
