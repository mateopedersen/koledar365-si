require 'json'
require 'time'

# The named phase pages include the current year independently of the printable
# 2027–2030 lunar atlas. USNO supplies minute-resolution UT1, represented here as
# approximate UTC; the sub-second UT1/UTC difference is below display precision.
class LunarPhaseSchedule
  YEARS = (2026..2030).to_a.freeze
  ZONE = 'Europe/Ljubljana'.freeze
  ROOT = File.expand_path('../..', __dir__)
  PHASES = {
    'New Moon' => ['new_moon', 'Mlaj'],
    'First Quarter' => ['first_quarter', 'Prvi krajec'],
    'Full Moon' => ['full_moon', 'Polna luna'],
    'Last Quarter' => ['last_quarter', 'Zadnji krajec']
  }.freeze
  PATHS = { 'full_moon' => '/polna-luna/', 'new_moon' => '/mlaj/', 'all' => '/lunine-mene/' }.freeze
  TITLES = { 'full_moon' => 'Polna luna v Sloveniji', 'new_moon' => 'Mlaj v Sloveniji', 'all' => 'Lunine mene v Sloveniji' }.freeze
  NEXT_LABELS = { 'full_moon' => 'Naslednja polna luna', 'new_moon' => 'Naslednji mlaj', 'all' => 'Naslednja Lunina mena' }.freeze

  attr_reader :kind, :year

  def initialize(kind: 'full_moon', year: nil, at: Time.current)
    @kind = PATHS.key?(kind) ? kind : 'full_moon'
    candidate = year.to_s.match?(/\A\d{4}\z/) ? year.to_i : at.in_time_zone(ZONE).year
    @year = YEARS.include?(candidate) ? candidate : YEARS.last
  end

  def self.events
    @events ||= YEARS.flat_map do |year|
      JSON.parse(File.read(File.join(ROOT, 'data/source', "usno-moon-#{year}.json"))).fetch('phasedata').map do |row|
        key, label = PHASES.fetch(row.fetch('phase'))
        hour, minute = row.fetch('time').split(':').map(&:to_i)
        utc = Time.utc(row.fetch('year'), row.fetch('month'), row.fetch('day'), hour, minute)
        local = utc.in_time_zone(ZONE)
        { 'id' => "#{key}-#{utc.strftime('%Y%m%dT%H%MZ')}", 'kind' => key, 'label' => label, 'utc' => utc.iso8601,
          'date' => local.to_date.iso8601, 'time' => local.strftime('%H:%M'), 'zone' => local.utc_offset == 7200 ? 'CEST' : 'CET',
          'offset' => local.strftime('%:z'), 'year' => local.year, 'month' => local.month }
      end
    end.sort_by { |row| row.fetch('utc') }.freeze
  end

  def events = self.class.events.select { |row| kind == 'all' || row['kind'] == kind }
  def for_year = events.select { |row| row['year'] == year }
  def next_event(at: Time.current) = events.find { |row| Time.iso8601(row.fetch('utc')) > at }
  def title = TITLES.fetch(kind)
  def next_label = NEXT_LABELS.fetch(kind)
  def path = PATHS.fetch(kind)
  def file_path = "/astronomy/#{kind}-#{year}.ics"
  def payload = { kind: kind, year: year, years: YEARS, events: events, path: path, next_label: next_label, time_zone: ZONE }
end
