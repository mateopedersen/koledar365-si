class OccasionPlanner
  def self.observance(events)
    events.map do |event|
      entry(event.key, event.title, event.on, event.ends_on,
        detail: event.work_free ? 'Zakonsko dela prost dan' : 'Sam po sebi ni dela prost dan')
    end
  end

  def self.festival(festival, today:)
    festival.fetch('editions').sort_by { |edition| edition.fetch('start') }.filter_map do |edition|
      dates = OccasionCatalog.date_range(edition)
      next if dates.end < today

      entry("#{festival.fetch('slug')}-#{dates.begin}", festival.fetch('title'), dates.begin, dates.end,
        detail: festival.fetch('venue'), location: festival.fetch('venue'))
    end
  end

  def self.clock(changes)
    changes.map do |change|
      date = change.fetch(:date)
      period = change.fetch(:period)
      entry("premik-ure-#{date}", period, date,
        detail: "Premik ure #{change.fetch(:before)} na #{change.fetch(:after)} po slovenskem času")
        .merge(option_label: "#{date.strftime('%-d. %-m. %Y')} · #{period.delete_prefix('Prehod na ')}")
    end
  end

  def self.entry(key, title, date, finish = nil, detail:, location: nil)
    finish ||= date
    {
      key: key, title: title.sub(/\A./, &:upcase), start: date.iso8601, end: finish.iso8601, endExclusive: (finish + 1).iso8601,
      day: date.day, month: CalendarEngine::MONTHS.fetch(date.month - 1),
      weekday: CalendarEngine::DAYS.fetch(date.cwday - 1),
      label: date == finish ? I18n.l(date, format: :long) : "#{I18n.l(date, format: :long)} – #{I18n.l(finish, format: :long)}",
      detail: detail, location: location
    }
  end

  def self.selected(entries, today, preferred: nil)
    entries.find { |row| row[:start] == preferred } ||
      entries.find { |row| row.fetch(:end) >= today.iso8601 } || entries.last
  end

  def self.google_url(entry, page_url)
    dates = entry.values_at(:start, :endExclusive).map { |date| date.delete('-') }.join('/')
    params = { action: 'TEMPLATE', text: entry.fetch(:title), dates: dates,
      details: [entry.fetch(:detail), page_url].join("\n"), location: entry[:location] }.compact
    "https://calendar.google.com/calendar/render?#{URI.encode_www_form(params)}"
  end

  def self.default_ics(entry, page_url)
    IcsService.export([{
      'uid' => entry.fetch(:key), 'title' => entry.fetch(:title),
      'date' => entry.fetch(:start), 'end_date' => entry.fetch(:end),
      'notes' => [entry[:location], entry.fetch(:detail), page_url].compact.uniq.join("\n")
    }])
  end

  private_class_method :entry
end
