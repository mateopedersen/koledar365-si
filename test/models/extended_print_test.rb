require 'test_helper'
class ExtendedPrintTest < ActiveSupport::TestCase
 setup { FileUtils.mkdir_p(Rails.root.join('tmp')) }
 test 'annual lunar output includes all days once and every phase month' do
  options=PrintCatalog.normalize(type:'lunar',lunar_scope:'year',year:2028,design:'min-01')
  assert_equal '2028',PrintCatalog.identity(options)['period']
  result=PdfRenderer.new(options).render(Rails.root.join('tmp/lunar-year-test.pdf'))
  assert_equal 366,result[:primary_dates].uniq.size
  assert_equal 366,result[:primary_dates].size
  assert_operator result[:pages],:>=,24
  assert_equal 1,options['month']
 end
 test 'workday output preserves year and monthly scope in identity and dates' do
  annual=PrintCatalog.normalize(type:'workdays',year:2027,workday_scope:'year')
  monthly=PrintCatalog.normalize(type:'workdays',year:2028,month:2,workday_scope:'month')
  assert_equal '2027',PrintCatalog.identity(annual)['period']
  assert_equal '2028-02',PrintCatalog.identity(monthly)['period']
  result=PdfRenderer.new(monthly).render(Rails.root.join('tmp/workday-month-test.pdf'))
  assert_equal 29,result[:primary_dates].uniq.size
  assert_equal 20,CalendarEngine.working_days(Date.new(2028,2,1),Date.new(2028,2,29))[:working_days]
 end
end
