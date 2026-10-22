require 'json'
require 'time'

class AstronomySchedule
  YEARS = (2026..2030).to_a.freeze
  ZONE = 'Europe/Ljubljana'.freeze
  ROOT = File.expand_path('../..', __dir__)
  PATHS = { 'solar' => '/soncni-mrk/', 'lunar' => '/lunin-mrk/', 'perseids' => '/perzeidi/' }.freeze
  TITLES = { 'solar' => 'Sončni mrk v Sloveniji', 'lunar' => 'Lunin mrk v Sloveniji', 'perseids' => 'Perzeidi v Sloveniji' }.freeze
  KINDS = { 'partial' => 'Delni mrk', 'total' => 'Popolni mrk', 'annular' => 'Kolobarjasti mrk', 'penumbral' => 'Polsenčni mrk' }.freeze
  SOURCES = {
    'orion' => ['Astronomsko društvo Orion: lokalni časi Sončevega in Luninega mrka 2026', 'https://adorionmb.splet.arnes.si/2026/08/06/nekaj-zanimivih-astronomskih-dogodkov-v-noci-z-12-na-13-avgust-2026-in-javno-opazovanje-v-organizaciji-astronomskega-drustva-orion/'],
    'cosmolab' => ['Cosmolab: potek popolnega Luninega mrka 7. septembra 2025', 'https://cosmolab.si/projekti/Lunin%20mrk%202025'],
    'lunar_explainer' => ['Cosmolab: kako nastane Lunin mrk', 'https://cosmolab.si/projekti/Lunin%20mrk%202025/Lunini%20mrki%20splo%C5%A1no'],
    'solar_safety' => ['Dr. Primož Kajdič, Sončni blog: varno opazovanje Sončevega mrka', 'https://soncniblog.com/bliza-se-soncev-mrk/'],
    'solar_dates' => ['Spika: prihajajoči Sončevi mrki in solarni filtri', 'https://astronomska-revija-spika.si/filtri-za-varno-opazovanje-sonca/'],
    'perseids' => ['Portal v vesolje: avgustovsko nebo in Perzeidi 2026', 'https://portalvvesolje.si/novice/2026/Zanimivosti%20no%C4%8Dnega%20neba%20avgust%202026'],
    'perseids_observing' => ['Spika: kako opazovati meteorski roj Perzeidov', 'https://astronomska-revija-spika.si/kako-opazovati-meteorski-roj-perzeidov/'],
    'local_events' => ['Portal v vesolje: javna opazovanja v Sloveniji leta 2026', 'https://portalvvesolje.si/dogodki/2026/Opazovanja%20Son%C4%8Devega%20mrka%20in%20ostalih%20pojavov%20v%20Sloveniji']
  }.freeze
  CONTACTS = {
    'penumbral_begin' => 'Začetek polsenčne faze', 'partial_begin' => 'Začetek delne faze',
    'total_begin' => 'Začetek popolne faze', 'peak' => 'Maksimum mrka',
    'total_end' => 'Konec popolne faze', 'partial_end' => 'Konec delne faze', 'penumbral_end' => 'Konec polsenčne faze'
  }.freeze

  attr_reader :kind, :city, :year

  def self.data = @data ||= JSON.parse(File.read(File.join(ROOT, 'data/astronomy/events-2026-2030.json')))
  def initialize(kind: 'solar', city: 'ljubljana', year: nil, at: Time.current)
    @kind = PATHS.key?(kind) ? kind : 'solar'
    @city = cities.find { |row| row['id'] == city } || cities.first
    candidate = year.to_s.match?(/\A\d{4}\z/) ? year.to_i : next_event(at: at)&.fetch('year', nil) || at.in_time_zone(ZONE).year
    @year = YEARS.include?(candidate) ? candidate : YEARS.last
  end
  def cities = self.class.data.fetch('cities')
  def events = self.class.data.fetch(kind)
  def for_year = kind == 'perseids' ? events.find { |row| row['year'] == year }.fetch('nights') : events.select { |row| row['year'] == year }
  def local(event) = event.fetch('cities').fetch(city.fetch('id'))
  def next_event(at: Time.current)
    if kind == 'perseids'
      events.find { |row| row.fetch('nights').any? { |night| Time.iso8601(night.fetch('cities').fetch(city.fetch('id')).fetch('dark_end')) > at } }
    else
      events.find { |row| local(row).fetch('windows').any? { |w| Time.iso8601(w.fetch('end')) > at } }
    end
  end
  def title = TITLES.fetch(kind)
  def path = PATHS.fetch(kind)
  def file_path = "/astronomy/#{kind}-#{year}-#{city.fetch('id')}.ics"
  def payload = { kind: kind, year: year, years: YEARS, city: city['id'], cities: cities, events: events, path: path, time_zone: ZONE }
  def sources
    keys = case kind
    when 'solar' then %w[orion solar_dates solar_safety]
    when 'lunar' then %w[cosmolab orion lunar_explainer]
    else %w[perseids perseids_observing local_events]
    end
    keys.map { |key| SOURCES.fetch(key) }
  end
end
