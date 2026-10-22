require 'test_helper'

class AstronomyScheduleTest < ActiveSupport::TestCase
  test 'current year includes thirteen full moons and uses winter time after the October transition' do
    at = Time.utc(2026, 10, 21, 12)
    moon = LunarPhaseSchedule.new(at: at)
    assert_equal 2026, moon.year
    assert_equal 13, moon.for_year.length
    assert_equal ['2026-10-26', '05:12', 'CET'], moon.next_event(at: at).values_at('date', 'time', 'zone')
    may = moon.for_year.select { |event| event['month'] == 5 }
    assert_equal 2, may.length
    assert may.all? { |event| event['zone'] == 'CEST' }
    assert_nil moon.next_event(at: Time.utc(2031))
  end

  test 'new moons and all four phases retain USNO instants rather than reusing the full moon list' do
    new_moons = LunarPhaseSchedule.new(kind: 'new_moon', year: 2026)
    assert_equal 12, new_moons.for_year.length
    assert new_moons.for_year.all? { |row| row['kind'] == 'new_moon' }
    assert_equal '2026-11-09', new_moons.next_event(at: Time.utc(2026, 10, 21)).fetch('date')
    all = LunarPhaseSchedule.new(kind: 'all', year: 2026)
    assert_equal 50, all.for_year.length
    all.events.each do |event|
      local = Time.iso8601(event['utc']).in_time_zone('Europe/Ljubljana')
      assert_equal local.strftime('%H:%M'), event['time']
      assert_equal local.to_date.iso8601, event['date']
    end
  end

  test 'next eclipse means locally observable not the next global event' do
    at = Time.utc(2026, 10, 21)
    solar = AstronomySchedule.new(kind: 'solar', at: at)
    assert_equal '2027-08-02', solar.next_event(at: at).fetch('date')
    assert_equal 2027, solar.year
    assert_equal 'partial', solar.local(solar.next_event(at: at)).fetch('kind')
    lunar = AstronomySchedule.new(kind: 'lunar', at: at)
    assert_equal '2027-02-21', lunar.next_event(at: at).fetch('date')
    assert_equal 'penumbral', lunar.local(lunar.next_event(at: at)).fetch('kind')
  end

  test 'sunset truncates the observing window and below horizon central phases are not called visible' do
    solar = AstronomySchedule.new(kind: 'solar', year: 2026, city: 'maribor')
    august = solar.for_year.find { |event| event['date'] == '2026-08-12' }
    local = solar.local(august)
    assert local['visible']
    assert_not local['peak_visible']
    assert_operator Time.iso8601(local['windows'][0]['end']), :<, Time.iso8601(local['contacts']['peak']['utc'])
    assert_equal local['set'], local['windows'][0]['end']
    next_case = AstronomySchedule.new(kind: 'solar', year: 2028)
    january = next_case.for_year.find { |event| event['date'] == '2028-01-26' }
    assert_equal 'annular', next_case.local(january)['geometric_kind']
    assert_equal 'partial', next_case.local(january)['kind']
    assert_not next_case.local(january)['peak_visible']
  end

  test 'Slovenian primary reference checks and local interval invariants are retained in data' do
    checks = AstronomySchedule.data.fetch('metadata').fetch('validation')
    assert_equal 17, checks.length
    checks.each { |check| assert_operator check['difference_seconds'], :<=, check['tolerance_seconds'] }
    %w[solar lunar].each do |kind|
      AstronomySchedule.data.fetch(kind).each do |event|
        assert_equal 8, event['cities'].size
        event['cities'].each_value do |local|
          assert_equal local['windows'].any?, local['visible']
          local['windows'].each do |window|
            assert_operator Time.iso8601(window['start']), :<, Time.iso8601(window['end'])
          end
          next unless local['visible']
          assert_equal 33, local.fetch('track').length
          assert local['contacts'].values.any? { |contact| contact['above_horizon'] }
        end
      end
    end
  end

  test 'meteor planning nights do not assert an exact peak and moon free intervals stay inside night' do
    schedule = AstronomySchedule.new(kind: 'perseids', year: 2027)
    assert_nil schedule.events.find { |event| event['year'] == 2027 }.fetch('peak_prediction')
    assert_equal 3, schedule.for_year.length
    schedule.events.each do |season|
      season['nights'].each do |night|
        assert_includes 0..100, night['moon_illumination']
        night['cities'].each_value do |local|
          assert_operator local['dark_start'], :<, local['dark_end']
          local['moon_free'].each do |window|
            assert_operator window['start'], :>=, local['dark_start']
            assert_operator window['end'], :<=, local['dark_end']
            assert_operator window['start'], :<, window['end']
          end
        end
      end
    end
    assert_equal 2027, schedule.next_event(at: Time.utc(2027, 8, 13, 12)).fetch('year')
    assert_equal 2028, schedule.next_event(at: Time.utc(2027, 8, 14, 12)).fetch('year')
  end

  test 'published ICS files parse with UTC boundaries and omit invisible solar eclipses' do
    paths = Dir[Rails.root.join('public/astronomy/*.ics')]
    assert_equal 135, paths.length
    paths.each do |path|
      text = File.read(path)
      assert text.valid_encoding?
      calendar = Icalendar::Calendar.parse(text).first
      assert calendar
      calendar.events.each do |event|
        assert event.dtstart.tz_utc, path
        assert event.dtend.tz_utc, path
        assert_operator event.dtend.value, :>, event.dtstart.value
        assert_match(/@koledar365\.si\z/, event.uid.to_s)
      end
    end
    schedule = AstronomySchedule.new(kind: 'solar', year: 2029)
    assert_empty AstronomyIcalService.event_rows(schedule)
    moon = Icalendar::Calendar.parse(File.read(Rails.root.join('public/astronomy/full_moon-2026.ics'))).first
    october = moon.events.find { |event| event.uid.to_s.include?('20261026') }
    assert_equal Time.utc(2026, 10, 26, 4, 12).to_datetime, october.dtstart.value
    assert_equal 13, moon.events.length
  end
end
