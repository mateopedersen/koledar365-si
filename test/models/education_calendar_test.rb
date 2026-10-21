require 'test_helper'

class EducationCalendarTest < ActiveSupport::TestCase
  test 'the finite education registry has unique native titles and complete source metadata' do
    assert_equal 9, EducationCalendar.paths.length
    assert_equal 9, EducationCalendar::PAGES.values.map { |p| p[:title] }.uniq.length
    EducationCalendar.paths.each do |path|
      calendar = EducationCalendar.new(path: path)
      assert calendar.config[:description].present?
      assert calendar.config[:heading].present?
      assert calendar.events.any?
      assert calendar.sources.all? { |s| s['language'] == 'sl' && s['checkedAt'] == '2026-10-21' }
      assert calendar.events.all? { |e| calendar.source(e['source']) }
    end
  end

  test 'specific exam routes expose only their own type or grade to server rendered content' do
    general = EducationCalendar.new(path: '/matura/2027/splosna/')
    vocational = EducationCalendar.new(path: '/matura/2027/poklicna/')
    assert general.events.all? { |e| e['examType'] == 'general' }
    assert vocational.events.all? { |e| e['examType'] == 'vocational' }
    [3, 6, 9].each do |grade|
      calendar = EducationCalendar.new(path: "/npz/#{grade}-razred/")
      assert calendar.events.all? { |e| e['grades'] == [grade] }
    end
  end

  test 'school dates remain distinct by region, grade and school level' do
    calendar = EducationCalendar.new(path: '/solski-koledar/')
    selected = calendar.filtered(calendar.initial.merge('grade' => '9'), today: '2026-10-21')
    assert_equal '2027-06-15', selected.find { |e| e['id'] == 'school-primary-end9' }['start']
    assert_not selected.any? { |e| e['id'] == 'school-primary-end1-8' }
    secondary = calendar.filtered(calendar.initial.merge('level' => 'secondary'), today: '2026-10-21')
    assert_equal '2026-12-28', secondary.find { |e| e['id'] == 'school-secondary-newyear' }['start']
    assert_not secondary.any? { |e| e['kind'] == 'npz' }
    assert_equal ['2026-09-01', '2027-08-31'], calendar.range
  end

  test 'next date does not report an expired event and study year starts in October' do
    calendar = EducationCalendar.new(path: '/solski-koledar/')
    assert_equal '2026-10-26', calendar.next_event(today: '2026-10-21')['start']
    assert_nil calendar.next_event(today: '2028-01-01')
    assert_equal ['2026-10-01', '2027-09-30'], EducationCalendar.new(path: '/studijski-koledar/').range
  end
end
