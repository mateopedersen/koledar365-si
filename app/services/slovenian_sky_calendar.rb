class SlovenianSkyCalendar
  YEARS = AstronomySchedule::YEARS
  PATH = '/astronomski-koledar/'.freeze
  COVER = {
    'path' => '/lunar/photos/artemis-curve.jpg', 'width' => 1920, 'height' => 1280,
    'alt' => 'Kratersko obrobje Lune na posnetku misije Artemis II',
    'credit' => 'NASA · Artemis II',
    'source' => 'https://images.nasa.gov/details/art002e020904',
    'license_url' => 'https://www.nasa.gov/nasa-brand-center/images-and-media/'
  }.freeze
  SEASONS = {
    3 => ['Spomladansko enakonočje', '/letni-casi/pomladno-enakonocje/'],
    6 => ['Poletni solsticij', '/letni-casi/poletni-solsticij/'],
    9 => ['Jesensko enakonočje', '/letni-casi/jesensko-enakonocje/'],
    12 => ['Zimski solsticij', '/letni-casi/zimski-solsticij/']
  }.freeze
  TYPES = {
    'moon' => 'Lunine mene',
    'season' => 'Letni časi',
    'eclipse' => 'Sončevi in Lunini mrki',
    'perseids' => 'Perzeidi'
  }.freeze
  Event = Data.define(:date, :time, :title, :kind, :path, :note)

  def self.events
    @events ||= (moon_events + season_events + eclipses + perseids).sort_by { |event| [event.date, event.time&.strftime('%H:%M:%S').to_s] }.freeze
  end

  def self.moon_events
    LunarPhaseSchedule.events.map do |row|
      path = LunarPhaseSchedule::PATHS.fetch(row.fetch('kind'), LunarPhaseSchedule::PATHS.fetch('all'))
      timed_event(Time.iso8601(row.fetch('utc')), row.fetch('label'), 'moon', "#{path}?year=#{row.fetch('year')}#astro-table-title")
    end
  end

  def self.season_events
    YEARS.flat_map do |year|
      JSON.parse(Rails.root.join('data/source', "usno-seasons-#{year}.json").read).fetch('data').filter_map do |row|
        next unless %w[Equinox Solstice].include?(row.fetch('phenom'))

        title, path = SEASONS.fetch(row.fetch('month'))
        hour, minute = row.fetch('time').split(':').map(&:to_i)
        timed_event(Time.utc(year, row.fetch('month'), row.fetch('day'), hour, minute), title, 'season', path)
      end
    end
  end

  def self.eclipses
    %w[solar lunar].flat_map do |kind|
      AstronomySchedule.data.fetch(kind).map do |row|
        title = AstronomySchedule::KINDS.fetch(row.fetch('kind')).sub(' mrk', kind == 'solar' ? ' Sončev mrk' : ' Lunin mrk')
        path = "#{AstronomySchedule::PATHS.fetch(kind)}?year=#{row.fetch('year')}&event=#{row.fetch('id')}#astro-event-selection"
        timed_event(Time.iso8601(row.fetch('peak')), title, 'eclipse', path, 'Globalni maksimum')
      end
    end
  end

  def self.perseids
    AstronomySchedule.data.fetch('perseids').flat_map do |year|
      year.fetch('nights').map do |row|
        date = Date.iso8601(row.fetch('date'))
        Event.new(date: date, time: nil, title: 'Perzeidi', kind: 'perseids', path: "/perzeidi/?year=#{date.year}#astro-table-title",
          note: "Noč z #{date.day}. na #{date.next_day.day}. avgust")
      end
    end
  end

  def self.timed_event(utc, title, kind, path, note = nil)
    time = Time.at((utc.to_f / 60).round * 60).in_time_zone(AstronomySchedule::ZONE)
    Event.new(date: time.to_date, time: time, title: title, kind: kind, path: path, note: note)
  end

  private_class_method :moon_events, :season_events, :eclipses, :perseids, :timed_event
end
