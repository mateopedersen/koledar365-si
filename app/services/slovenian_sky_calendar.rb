class SlovenianSkyCalendar
  YEARS = AstronomySchedule::YEARS
  PATH = '/astronomski-koledar/'.freeze
  SEASONS = {
    3 => ['Spomladansko enakonočje', '/letni-casi/pomladno-enakonocje/'],
    6 => ['Poletni solsticij', '/letni-casi/poletni-solsticij/'],
    9 => ['Jesensko enakonočje', '/letni-casi/jesensko-enakonocje/'],
    12 => ['Zimski solsticij', '/letni-casi/zimski-solsticij/']
  }.freeze
  TYPES = {
    'moon' => ['Lunine mene', 'moon'],
    'season' => ['Letni časi', 'sun'],
    'eclipse' => ['Mrki', 'sun'],
    'perseids' => ['Perzeidi', 'star']
  }.freeze
  Event = Data.define(:date, :time, :title, :kind, :path, :note)

  def self.events
    @events ||= (moon_events + season_events + eclipses + perseids).sort_by { |event| [event.date, event.time&.strftime('%H:%M:%S').to_s] }.freeze
  end

  def self.moon_events
    LunarPhaseSchedule.events.map do |row|
      timed_event(Time.iso8601(row.fetch('utc')), row.fetch('label'), 'moon', '/lunine-mene/')
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
    { 'solar' => 'Sončni mrk', 'lunar' => 'Lunin mrk' }.flat_map do |kind, title|
      AstronomySchedule.data.fetch(kind).map do |row|
        timed_event(Time.iso8601(row.fetch('peak')), title, 'eclipse', AstronomySchedule::PATHS.fetch(kind),
          "#{AstronomySchedule::KINDS.fetch(row.fetch('kind'))} · globalni maksimum")
      end
    end
  end

  def self.perseids
    AstronomySchedule.data.fetch('perseids').flat_map do |year|
      year.fetch('nights').map do |row|
        date = Date.iso8601(row.fetch('date'))
        Event.new(date: date, time: nil, title: 'Perzeidi', kind: 'perseids', path: '/perzeidi/',
          note: "Noč z #{date.day}. na #{date.next_day.day}. avgust")
      end
    end
  end

  def self.timed_event(utc, title, kind, path, note = nil)
    time = utc.in_time_zone(AstronomySchedule::ZONE)
    Event.new(date: time.to_date, time: time, title: title, kind: kind, path: path, note: note)
  end

  private_class_method :moon_events, :season_events, :eclipses, :perseids, :timed_event
end
