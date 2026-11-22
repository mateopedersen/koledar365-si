class OccasionCatalog
  PATH = '/festivali/'.freeze
  TITLE = 'Festivali in prireditve v Sloveniji 2027–2030'.freeze
  DESCRIPTION = 'Kdaj in kje potekajo slovenski festivali, sejmi, koncerti in športne prireditve? Preverite potrjene termine, prizorišča, uradne programe in prenesite izbrane dogodke v koledar.'.freeze
  KINDS = {
    'dediscina' => 'Izročilo in dediščina', 'kultura' => 'Kultura in umetnost',
    'glasba' => 'Glasba', 'film' => 'Film', 'kulinarika' => 'Kulinarika',
    'sport' => 'Šport', 'zima' => 'Praznični sejmi in zima'
  }.freeze

  def self.data
    @data ||= JSON.parse(Rails.root.join('data/source/slovenian-occasions.json').read)
  end

  def self.checked_on = data.fetch('checked_on')
  def self.observances = data.fetch('observances')
  def self.festivals = data.fetch('festivals')
  def self.observance(slug) = observances.find { |row| row.fetch('slug') == slug }
  def self.festival_path(slug) = "#{PATH}##{slug}"
  def self.ics_path(slug, start) = "#{PATH}#{slug}/#{start}.ics"

  def self.ics(event)
    notes = [event.metadata['place'], event.metadata['venue'], "Vir: #{event.source_url}"].compact.join("\n")
    IcsService.export([{
      'uid'=>event.key, 'date'=>event.on.iso8601, 'end_date'=>event.ends_on&.to_s,
      'title'=>event.title, 'notes'=>notes
    }])
  end

  def self.pages
    @pages ||= begin
      new_days = observances.to_h do |row|
        ["/pomembni-dnevi/#{row.fetch('slug')}/", {
          title: row.fetch('title'), description: row.fetch('description'), family: 'Ek önemli gün konuları'
        }]
      end
      existing_days = TopicContent.guides.filter_map do |slug, guide|
        next unless guide['page_title']
        ["/pomembni-dnevi/#{slug}/", {
          title: guide.fetch('page_title'), description: guide.fetch('page_description'), family: 'Ek önemli gün konuları'
        }]
      end.to_h
      new_days.merge(existing_days, PATH => { title: TITLE, description: DESCRIPTION, family: 'festivals' }).freeze
    end
  end

  def self.date_range(edition)
    Date.iso8601(edition.fetch('start'))..Date.iso8601(edition.fetch('end'))
  end

  def self.upcoming(today, limit: 4)
    festivals.flat_map do |festival|
      festival.fetch('editions').filter_map do |edition|
        dates = date_range(edition)
        [festival, edition, dates] if dates.end >= today
      end
    end.sort_by { |festival, _, dates| [[dates.begin, today].max, dates.begin, festival.fetch('title')] }.first(limit)
  end

  def self.edition_title(festival, edition)
    label = edition['label']
    label ? "#{festival.fetch('title')} · #{label}" : festival.fetch('title')
  end

  def self.events
    observed = observances.flat_map do |topic|
      CalendarEngine::INTERACTIVE_YEARS.flat_map do |year|
        CalendarEngine.rule_dates(topic.fetch('rule'), year).map do |date|
          {
            key: "si-day:#{topic.fetch('slug')}:#{date}", slug: topic.fetch('slug'), title: topic.fetch('title'),
            on: date, category: topic.fetch('category'), source_url: topic.fetch('source_url'),
            metadata: topic.slice('place')
          }
        end
      end
    end
    editions = festivals.flat_map do |festival|
      festival.fetch('editions').map do |edition|
        dates = date_range(edition)
        raise ArgumentError, "Neveljaven termin: #{festival.fetch('slug')}" if dates.end < dates.begin
        {
          key: "si-festival:#{festival.fetch('slug')}:#{dates.begin.year}", slug: festival.fetch('slug'),
          title: edition_title(festival, edition), on: dates.begin, ends_on: dates.end == dates.begin ? nil : dates.end,
          category: 'festival', source_url: edition.fetch('source_url'),
          metadata: festival.slice('place', 'venue').merge('checked_on' => checked_on)
        }
      end
    end
    (observed + editions).map do |row|
      { ends_on: nil, metadata: {}, work_free: false, state_holiday: false }.merge(row)
    end
  end

  def self.apply!
    rows = events
    raise ArgumentError, 'Podvojeni koledarski dogodki' unless rows.map { |row| row.fetch(:key) }.uniq.size == rows.size
    CalendarEvent.transaction do
      rows.each do |row|
        record = CalendarEvent.find_or_initialize_by(key: row.fetch(:key))
        record.assign_attributes(row.except(:key))
        record.save! if record.changed?
      end
      CalendarEvent.where('key LIKE ? OR key LIKE ?', 'si-day:%', 'si-festival:%')
        .where.not(key: rows.map { |row| row.fetch(:key) }).delete_all
      TopicContent.guides.each do |slug, guide|
        next unless guide['correct_date_source']
        url = guide.fetch('source_url')
        CalendarEvent.where(slug:slug).where.not(source_url:url).update_all(source_url:url)
      end
    end
  end
end
