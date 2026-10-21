class ClockChangeSchedule
  YEARS = (2026..2030).to_a.freeze
  TITLE = 'Premik ure 2026–2030: poletni in zimski čas'.freeze
  DESCRIPTION = 'Datumi premika ure v Sloveniji za leta 2026–2030. Spomladi uro premaknemo z 2. na 3. uro, jeseni pa s 3. na 2. uro.'.freeze
  IMAGE_BASE = '/images/premik-ure/premik-ure-slovenija-poletni-zimski-cas'.freeze
  IMAGE_PATH = "#{IMAGE_BASE}-1200.webp".freeze
  IMAGE_ALT = 'Premik ure v Sloveniji: spomladi z 02:00 na 03:00, jeseni s 03:00 na 02:00.'.freeze
  SOURCES = [
    ['Uredba o določitvi obdobja poletnega časa – 3. člen', 'https://www.uradni-list.si/glasilo-uradni-list-rs/vsebina/2006-01-0299'],
    ['Evropska komisija: časovni razpored za leto 2026 (2021/C 149/01)', 'https://eur-lex.europa.eu/legal-content/SL/TXT/PDF/?uri=CELEX%3A52021XC0427%2801%29'],
    ['Evropska komisija: časovni razpored 2027–2031 (C/2026/1660)', 'https://eur-lex.europa.eu/eli/C/2026/1660/oj/slv/pdf'],
    ['Svet EU: sezonsko premikanje ure in predlog za odpravo', 'https://www.consilium.europa.eu/sl/policies/seasonal-time-changes/']
  ].freeze

  def self.transitions
    YEARS.flat_map do |year|
      CalendarEngine.rule_dates({'kind'=>'last_sunday', 'months'=>[3,10]}, year).map do |date|
        spring = date.month == 3
        before, after, direction = spring ? ['02:00','03:00','naprej'] : ['03:00','02:00','nazaj']
        {
          date: date, instant: Time.utc(year,date.month,date.day,1),
          season: spring ? 'spring' : 'autumn', direction: direction,
          period: spring ? 'Prehod na poletni čas' : 'Prehod na zimski čas',
          before: before, after: after,
          date_label: "#{date.day}. #{CalendarEngine::MONTHS.fetch(date.month-1)} #{year}",
          sentence: "V nedeljo, #{date.day}. #{spring ? 'marca' : 'oktobra'} #{year}, ob #{spring ? 2 : 3}. uri uro premaknemo za eno uro #{direction}, na #{spring ? 3 : 2}. uro."
        }
      end
    end
  end

  def by_year = self.class.transitions.group_by { |row| row[:date].year }
  def next_change(at: Time.current) = self.class.transitions.find { |row| row[:instant] > at }
  def payload = self.class.transitions.map { |row| row.merge(date: row[:date].iso8601, instant: row[:instant].iso8601) }
end
