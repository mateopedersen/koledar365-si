class SunEngine
  TIME_ZONE = 'Europe/Ljubljana'.freeze
  SUNRISE_ALTITUDE = -0.833 # Apparent horizon, including refraction and the solar disc.
  CIVIL_TWILIGHT_ALTITUDE = -6.0
  GOLDEN_HOUR_HIGH_ALTITUDE = 6.0
  GOLDEN_HOUR_LOW_ALTITUDE = -4.0

  # GOV.SI's official register of Slovenian settlements with city status.
  CITIES = CityCatalog.all.each_with_object({}) do |city, index|
    coordinates = city.fetch('coordinates').first
    index[city.fetch('id')] = [city.fetch('name'), coordinates.fetch('lat'), coordinates.fetch('lon')].freeze
  end.freeze

  def self.calculate(date, city_id)
    name, latitude, longitude = CITIES.fetch(city_id)
    utc_midnight = Time.utc(date.year, date.month, date.day)
    noon_guess = approximate_noon_minutes(date, longitude)
    solar_noon = solar_transit(utc_midnight, noon_guess, longitude, latitude)

    sun_events = crossings(utc_midnight, longitude, latitude, SUNRISE_ALTITUDE)
    sunrise = sun_events.find { |direction, _time| direction == :rise }&.last
    sunset = sun_events.find { |direction, _time| direction == :set }&.last
    civil_events = crossings(utc_midnight, longitude, latitude, CIVIL_TWILIGHT_ALTITUDE)
    golden_high_events = crossings(utc_midnight, longitude, latitude, GOLDEN_HOUR_HIGH_ALTITUDE)
    golden_low_events = crossings(utc_midnight, longitude, latitude, GOLDEN_HOUR_LOW_ALTITUDE)
    civil_dawn = civil_events.find { |direction, _time| direction == :rise }&.last
    civil_dusk = civil_events.find { |direction, _time| direction == :set }&.last
    golden_morning_start = golden_low_events.find { |direction, _time| direction == :rise }&.last
    golden_morning_end = golden_high_events.find { |direction, _time| direction == :rise }&.last
    golden_evening_start = golden_high_events.find { |direction, _time| direction == :set }&.last
    golden_evening_end = golden_low_events.find { |direction, _time| direction == :set }&.last
    raise ArgumentError, "Sunrise or sunset not found for #{city_id} on #{date}" unless sunrise && sunset

    noon_position = solar_position(solar_noon, longitude, latitude)
    {
      city_id: city_id,
      name: name,
      latitude: latitude,
      longitude: longitude,
      equation_of_time: 720.0 - 4.0 * longitude - (solar_noon - utc_midnight) / 60.0,
      declination: noon_position[:declination],
      sunrise_altitude: SUNRISE_ALTITUDE,
      rise: in_local_time(sunrise),
      set: in_local_time(sunset),
      solar_noon: in_local_time(solar_noon),
      civil_dawn: in_local_time(civil_dawn),
      civil_dusk: in_local_time(civil_dusk),
      golden_morning_start: in_local_time(golden_morning_start),
      golden_morning_end: in_local_time(golden_morning_end),
      golden_evening_start: in_local_time(golden_evening_start),
      golden_evening_end: in_local_time(golden_evening_end),
      minutes: ((sunset - sunrise) / 60.0).round
    }
  end

  def self.city?(city_id)
    CITIES.key?(city_id)
  end

  # Fast estimate only brackets the transit search. Rise/set and twilight are
  # then solved from apparent right ascension and Greenwich sidereal time.
  def self.approximate_noon_minutes(date, longitude)
    days = Date.gregorian_leap?(date.year) ? 366.0 : 365.0
    gamma = 2.0 * Math::PI / days * (date.yday - 1)
    equation = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma))
    720.0 - 4.0 * longitude - equation
  end
  private_class_method :approximate_noon_minutes

  def self.solar_transit(utc_midnight, noon_guess, longitude, latitude)
    left = utc_midnight + (noon_guess - 30.0) * 60.0
    right = utc_midnight + (noon_guess + 30.0) * 60.0
    48.times do
      midpoint = left + (right - left) / 2.0
      if solar_position(midpoint, longitude, latitude)[:hour_angle] < 0
        left = midpoint
      else
        right = midpoint
      end
    end
    left + (right - left) / 2.0
  end
  private_class_method :solar_transit

  def self.crossings(utc_midnight, longitude, latitude, target_altitude)
    samples = []
    step = 300.0
    0.upto(24 * 60 / 5) do |index|
      instant = utc_midnight + index * step
      position = solar_position(instant, longitude, latitude)
      samples << [instant, position[:altitude] - target_altitude]
    end
    events = []
    samples.each_cons(2) do |(first_time, first_value), (last_time, last_value)|
      direction = if first_value < 0 && last_value >= 0
        :rise
      elsif first_value >= 0 && last_value < 0
        :set
      end
      next unless direction

      left = first_time
      right = last_time
      40.times do
        midpoint = left + (right - left) / 2.0
        value = solar_position(midpoint, longitude, latitude)[:altitude] - target_altitude
        if (direction == :rise && value < 0) || (direction == :set && value >= 0)
          left = midpoint
        else
          right = midpoint
        end
      end
      events << [direction, left + (right - left) / 2.0]
    end
    events
  end
  private_class_method :crossings

  # Meeus apparent solar coordinates and mean sidereal time. UTC is used as an
  # approximation to UT1; the resulting civil times are rounded to one minute.
  def self.solar_position(instant, longitude, latitude)
    julian_day = instant.to_f / 86_400.0 + 2_440_587.5
    centuries = (julian_day - 2_451_545.0) / 36_525.0
    mean_longitude = (280.46646 + centuries * (36_000.76983 + 0.0003032 * centuries)) % 360.0
    mean_anomaly = (357.52911 + centuries * (35_999.05029 - 0.0001537 * centuries)) * Math::PI / 180.0
    eccentricity = 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries)
    center = Math.sin(mean_anomaly) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries)) +
      Math.sin(2.0 * mean_anomaly) * (0.019993 - 0.000101 * centuries) + Math.sin(3.0 * mean_anomaly) * 0.000289
    true_longitude = mean_longitude + center
    omega = (125.04 - 1934.136 * centuries) * Math::PI / 180.0
    apparent_longitude = (true_longitude - 0.00569 - 0.00478 * Math.sin(omega)) * Math::PI / 180.0
    mean_obliquity = 23.0 + (26.0 + (21.448 - centuries * (46.815 + centuries * (0.00059 - centuries * 0.001813))) / 60.0) / 60.0
    obliquity = (mean_obliquity + 0.00256 * Math.cos(omega)) * Math::PI / 180.0
    right_ascension = Math.atan2(Math.cos(obliquity) * Math.sin(apparent_longitude), Math.cos(apparent_longitude)) * 180.0 / Math::PI
    declination = Math.asin(Math.sin(obliquity) * Math.sin(apparent_longitude))
    sidereal_time = (280.46061837 + 360.98564736629 * (julian_day - 2_451_545.0) +
      0.000387933 * centuries**2 - centuries**3 / 38_710_000.0) % 360.0
    hour_angle_degrees = ((sidereal_time + longitude - right_ascension + 180.0) % 360.0) - 180.0
    latitude_radians = latitude * Math::PI / 180.0
    hour_angle = hour_angle_degrees * Math::PI / 180.0
    altitude_sine = Math.sin(latitude_radians) * Math.sin(declination) +
      Math.cos(latitude_radians) * Math.cos(declination) * Math.cos(hour_angle)
    {
      hour_angle: hour_angle_degrees,
      altitude: Math.asin([[altitude_sine, -1.0].max, 1.0].min) * 180.0 / Math::PI,
      declination: declination * 180.0 / Math::PI,
      right_ascension: right_ascension
    }
  end
  private_class_method :solar_position

  def self.in_local_time(instant)
    instant.in_time_zone(TIME_ZONE)
  end
  private_class_method :in_local_time
end
