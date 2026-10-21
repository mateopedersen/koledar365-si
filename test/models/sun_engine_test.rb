require 'json'
require 'test_helper'

class SunEngineTest < ActiveSupport::TestCase
  REFERENCE = JSON.parse(Rails.root.join('evidence/solar/usno-2027-crosschecks.json').read).fetch('references').freeze

  test 'uses the official 69 Slovenian city-status settlements and their coordinates' do
    assert_equal 69, SunEngine::CITIES.size
    assert_equal CityCatalog.all.map { |city| city.fetch('id') }.sort, SunEngine::CITIES.keys.sort
    SunEngine::CITIES.each_value do |name, latitude, longitude|
      assert name.present?
      assert latitude.between?(45.4, 47.0), "#{name} latitude outside Slovenia"
      assert longitude.between?(13.3, 16.7), "#{name} longitude outside Slovenia"
    end
  end

  test 'agrees with independent USNO daily references to within one minute' do
    REFERENCE.each do |reference|
      date = Date.iso8601(reference.fetch('date'))
      result = SunEngine.calculate(date, 'ljubljana')
      {
        'begin_civil_twilight' => result.fetch(:civil_dawn),
        'sunrise' => result.fetch(:rise),
        'solar_transit' => result.fetch(:solar_noon),
        'sunset' => result.fetch(:set),
        'end_civil_twilight' => result.fetch(:civil_dusk)
      }.each do |key, actual|
        expected = reference.fetch(key).split(':').map(&:to_i).then { |hour, minute| hour * 60 + minute }
        actual_minutes = actual.hour * 60 + actual.min
        assert_operator (actual_minutes - expected).abs, :<=, 1,
          "#{reference.fetch('date')} #{key}: got #{actual.strftime('%H:%M')}, USNO #{reference.fetch(key)}"
      end
      expected_offset = reference.fetch('daylight_saving') ? '+0200' : '+0100'
      assert_equal expected_offset, result.fetch(:rise).strftime('%z'), "wrong Ljubljana offset on #{date}"
    end
  end

  test 'orders sunrise, golden hour, solar noon, sunset and twilight on leap day' do
    result = SunEngine.calculate(Date.new(2028, 2, 29), 'koper')
    assert_equal Date.new(2028, 2, 29), result.fetch(:rise).to_date
    assert_operator result.fetch(:civil_dawn), :<, result.fetch(:golden_morning_start)
    assert_operator result.fetch(:golden_morning_start), :<, result.fetch(:golden_morning_end)
    assert_operator result.fetch(:golden_morning_start), :<, result.fetch(:rise)
    assert_operator result.fetch(:rise), :<, result.fetch(:golden_morning_end)
    assert_operator result.fetch(:golden_morning_end), :<, result.fetch(:solar_noon)
    assert_operator result.fetch(:solar_noon), :<, result.fetch(:golden_evening_start)
    assert_operator result.fetch(:golden_evening_start), :<, result.fetch(:set)
    assert_operator result.fetch(:set), :<, result.fetch(:golden_evening_end)
    assert_operator result.fetch(:set), :<, result.fetch(:civil_dusk)
    assert_operator result.fetch(:minutes), :>, 0
  end

  test 'calculates valid sunrise and sunset for every city at both DST offsets' do
    [Date.new(2027, 1, 15), Date.new(2027, 7, 15)].each do |date|
      expected_offset = date.month == 7 ? '+0200' : '+0100'
      SunEngine::CITIES.each_key do |city_id|
        result = SunEngine.calculate(date, city_id)
        assert_equal expected_offset, result.fetch(:rise).strftime('%z'), "#{city_id} on #{date}"
        assert_operator result.fetch(:civil_dawn), :<, result.fetch(:rise)
        assert_operator result.fetch(:rise), :<, result.fetch(:solar_noon)
        assert_operator result.fetch(:solar_noon), :<, result.fetch(:set)
        assert_operator result.fetch(:set), :<, result.fetch(:civil_dusk)
      end
    end
  end
end
