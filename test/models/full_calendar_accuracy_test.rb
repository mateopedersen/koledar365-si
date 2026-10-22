require 'test_helper'
class FullCalendarAccuracyTest < ActiveSupport::TestCase
  test 'all sixty months cover exactly their real dates in Monday-first grids' do
    (2026..2030).each do |year|
      (1..12).each do |month|
        weeks=CalendarEngine.weeks(year,month)
        assert_includes [4,5,6],weeks.size
        weeks.each{|week|assert_equal (1..7).to_a,week.map(&:cwday);assert_equal 1,week.map(&:cweek).uniq.size}
        dates=weeks.flatten.select{|d|d.year==year&&d.month==month}
        assert_equal (1..Date.new(year,month,-1).day).to_a,dates.map(&:day)
        assert_equal dates.uniq,dates
      end
    end
  end
  test 'leap day, ISO year boundaries and movable holidays match independent fixtures' do
    feb=CalendarEngine.weeks(2028,2).flatten.select{|d|d.month==2}
    assert_equal 29,feb.size;assert_equal 2,feb.last.cwday
    assert_equal [2026,53],[Date.new(2027,1,1).cwyear,Date.new(2027,1,1).cweek]
    {2026=>'2026-04-05',2027=>'2027-03-28',2028=>'2028-04-16',2029=>'2029-04-01',2030=>'2030-04-21'}.each do |year,date|
      assert_equal Date.iso8601(date),CalendarEngine.easter(year)
      assert_includes CalendarEngine.work_free_dates(Date.new(year,1,1),Date.new(year,12,31)),Date.iso8601(date)+1
    end
  end
end
