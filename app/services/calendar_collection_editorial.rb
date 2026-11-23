class CalendarCollectionEditorial
  DIRECTORY_DESCRIPTION = 'Primerjajte slovenske koledarje 2027–2030 po letih in mesecih. Poiščite praznike in delovnike ter izberite PDF za tisk, sliko ali preglednico Excel.'.freeze

  def self.find(path)
    entries.fetch(path, nil)
  end

  def self.title(page)
    return "Koledar #{page.year}" unless page.month

    "Koledar za #{CalendarEngine::MONTHS.fetch(page.month - 1)} #{page.year}"
  end

  def self.description(page)
    return DIRECTORY_DESCRIPTION if page.path == '/koledar/'

    copy = find(page.path)
    return unless copy

    return "#{title(page)}: 15 brezplačnih predlog A3 za tiskanje, PDF in slike za prenos. #{copy.fetch('snippet')}" if copy.key?('print_tip')

    "#{title(page)} za tiskanje. PDF, slika in Excel. #{copy.fetch('snippet')}"
  end

  def self.example(copy)
    record = copy.fetch('example')
    from, to = record.values_at('from', 'to').map { |date| Date.iso8601(date) }
    [record, from, to, CalendarEngine.working_days(from, to)]
  end

  def self.entries
    @entries ||= JSON.parse(Rails.root.join('data/calendar-collection/editorial.json').read).freeze
  end
  private_class_method :entries
end
