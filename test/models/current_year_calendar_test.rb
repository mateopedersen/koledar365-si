require 'test_helper'

class CurrentYearCalendarTest < ActiveSupport::TestCase
  test 'full 2026 workdays match Slovenian statutory dates even without bridge rows' do
    CalendarEvent.where(on:Date.new(2026,1,1)..Date.new(2026,12,31)).delete_all
    dates=CalendarEngine.statutory_work_free_events(2026).map { |event|event.fetch(:on).iso8601 }
    assert_equal %w[2026-01-01 2026-01-02 2026-02-08 2026-04-05 2026-04-06 2026-04-27 2026-05-01 2026-05-02 2026-05-24 2026-06-25 2026-08-15 2026-10-31 2026-11-01 2026-12-25 2026-12-26],dates
    result=CalendarEngine.working_days(Date.new(2026,1,1),Date.new(2026,12,31))
    assert_equal 365,result[:calendar_days]
    assert_equal 254,result[:working_days]
    assert_equal 7,result[:excluded_holidays].size
    assert_equal [2027,2028,2029,2030],CalendarEngine::YEARS,'The existing print catalog must retain its four-year identity.'
  end

  test '2026 Easter and a cross-year interval count each free day once' do
    result=CalendarEngine.working_days(Date.new(2026,4,3),Date.new(2026,4,7))
    assert_equal [Date.new(2026,4,3),Date.new(2026,4,7)],result[:dates]
    assert_equal [Date.new(2026,4,6)],result[:excluded_holidays]
    result=CalendarEngine.working_days(Date.new(2026,12,31),Date.new(2027,1,4))
    assert_equal [Date.new(2026,12,31),Date.new(2027,1,4)],result[:dates]
    assert_equal [Date.new(2027,1,1)],result[:excluded_holidays]
    assert_raises(ArgumentError) { CalendarEngine.working_days(Date.new(2025,12,31),Date.new(2026,1,4)) }
  end

  test 'a selected 2026 period is printable without changing year or date' do
    options=PrintCatalog.normalize(type:'monthly',year:2026,month:10,date:'2026-10-21')
    assert_equal 2026,options['year']
    assert_equal '2026-10-21',options['date']
    assert_equal '2026-10',PrintCatalog.identity(options)['period']
    path=Rails.root.join('tmp/current-year-calendar-test.pdf')
    proof=PdfRenderer.new(options).render(path)
    assert_equal (Date.new(2026,10,1)..Date.new(2026,10,31)).map(&:iso8601),proof[:primary_dates]
    error=assert_raises(ArgumentError) { PrintCatalog.normalize(type:'lunar',year:2026) }
    assert_includes error.message,'2027–2030'
  ensure
    FileUtils.rm_f(path) if path
  end
end
