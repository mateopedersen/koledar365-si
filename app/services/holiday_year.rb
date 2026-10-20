class HolidayYear
  LAW_URL = 'https://pisrs.si/pregledPredpisa?id=ZAKO865'.freeze
  AMENDMENT_URL = 'https://pisrs.si/api/uradni-list/objava/u20261567.pdf'.freeze
  CHECKED_ON = Date.new(2026, 10, 20)
  KINDS = %w[all free working].freeze
  attr_reader :year, :events

  def initialize(year)
    @year = Integer(year)
    raise ArgumentError, 'Izberite leto med 2027 in 2030.' unless CalendarEngine::YEARS.include?(@year)
    @events = CalendarEvent.where(category: 'legal', on: Date.new(@year, 1, 1)..Date.new(@year, 12, 31)).ordered.to_a
  end

  def free_dates = events.select(&:work_free).map(&:on).uniq
  def weekday_free_dates = free_dates.select { |date| date.cwday <= 5 }
  def weekend_free_dates = free_dates.select { |date| date.cwday >= 6 }
  def working_days = (Date.new(year, 1, 1)..Date.new(year, 12, 31)).count { |date| date.cwday <= 5 } - weekday_free_dates.size

  def self.query(value)
    value.to_s.first(100).unicode_normalize(:nfd).gsub(/\p{Mn}/, '').downcase.strip
  end

  def filter(month: nil, kind: nil, query: nil)
    month = month.to_i
    needle = self.class.query(query)
    events.select do |event|
      (month.zero? || event.on.month == month) &&
        (kind != 'free' || event.work_free) &&
        (kind != 'working' || !event.work_free) &&
        (needle.empty? || self.class.query("#{event.title} #{CalendarEngine::DAYS[event.on.cwday - 1]}").include?(needle))
    end
  end

  def breaks(budget: 1, limit: 3)
    chosen = []
    CalendarEngine.vacations(year, budget).each do |option|
      next if chosen.any? { |existing| option[:from] <= existing[:to] && option[:to] >= existing[:from] }
      option[:leave_dates] = (option[:from]..option[:to]).select { |date| date.cwday <= 5 && !free_dates.include?(date) }
      chosen << option
      break if chosen.size == limit
    end
    chosen
  end
end
