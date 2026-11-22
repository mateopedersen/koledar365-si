class CalendarCollectionEditorial
  def self.find(path)
    entries.fetch(path, nil)
  end

  def self.title(page)
    return "Koledar #{page.year}" unless page.month

    "Koledar za #{CalendarEngine::MONTHS.fetch(page.month - 1)} #{page.year}"
  end

  def self.description(page)
    copy = find(page.path)
    return unless copy

    "#{title(page)} za tiskanje. 15 predlog PDF A3 in slik za prenos. #{copy.fetch('snippet')}"
  end

  def self.entries
    @entries ||= JSON.parse(Rails.root.join('data/calendar-collection/editorial.json').read).freeze
  end
  private_class_method :entries
end
