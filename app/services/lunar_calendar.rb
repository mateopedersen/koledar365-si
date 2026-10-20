require 'json'
require 'date'
require 'digest'
class LunarCalendar
  ROOT = File.expand_path('../..', __dir__)
  MONTHS = %w[januar februar marec april maj junij julij avgust september oktober november december].freeze
  GENITIVE = %w[januarja februarja marca aprila maja junija julija avgusta septembra oktobra novembra decembra].freeze
  WEEKDAYS = %w[ponedeljek torek sreda četrtek petek sobota nedelja].freeze
  SHORT = %w[pon tor sre čet pet sob ned].freeze
  class << self
    def read(name) = JSON.parse(File.read(File.join(ROOT,'data/lunar',name)))
    def days = (@days ||= read('lunar-daily-2027-2030.json').fetch('days'))
    def events = (@events ||= read('lunar-events-2027-2030.json').fetch('events'))
    def period(year,month=nil) = days.select { |d| d['date'].start_with?(month ? '%04d-%02d-' % [year,month] : "#{year}-") }
    def phases(year,month=nil) = events.select { |d| d['localDate'].start_with?(month ? '%04d-%02d-' % [year,month] : "#{year}-") }
    def path(year=nil,month=nil) = '/lunin-koledar/'+(year ? "#{year}/" : '')+(month ? MONTHS.fetch(month-1)+'/' : '')
    def date_label(iso)
      d=Date.iso8601(iso); "#{d.day}. #{GENITIVE.fetch(d.month-1)} #{d.year}"
    end
    def percent(day) = format('%.1f',day.fetch('illuminationFraction')*100).tr('.',',')+"\u00a0%"
    def event_label(e) = "#{e['phaseNameSl']} · #{date_label(e['localDate'])} ob #{e['localTime'].tr(':','.')} (UTC#{e['localDateTime'][-6..]})"
    def downloads(year,month=nil)
      @assets ||= File.exist?(File.join(ROOT,'data/lunar/assets.json')) ? read('assets.json').fetch('assets') : []
      @assets.select { |a| a['year']==year && a['month']==month }
    end
    def next_event(day)
      events.find { |e| e['utc']>day['utc'] } || buffer_events.find { |e|e['utc']>day['utc'] }
    end
    def buffer_events
      @buffer_events ||= read('buffer-events.json')
    end
    def payload(year,month)
      rows=period(year,month); {days:rows,events:phases(year,month),nextEvents:rows.to_h { |d|[d['date'],next_event(d)] }}
    end
    def validate!
      expected=(Date.new(2027,1,1)..Date.new(2030,12,31)).map(&:iso8601)
      raise 'Lunar dates incomplete' unless days.map { |d|d['date'] }==expected
      raise 'Lunar phases incomplete' unless events.size==198 && events.map { |e|e['id'] }.uniq.size==198
      days.each do |d|
        date=Date.iso8601(d['date']);raise "Invalid weekday #{date}" unless date.cwday==d['weekdayMonday']
        raise "Invalid illumination #{date}" unless (0..1).cover?(d['illuminationFraction'])
        ids=events.select { |e|e['localDate']==d['date'] }.map { |e|e['id'] }
        raise "Invalid phase binding #{date}" unless d['eventIds'].sort==ids.sort
      end
      true
    end
  end
end
