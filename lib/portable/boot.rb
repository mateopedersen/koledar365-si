# Browser-only host adapter. Business rules and the PDF renderer are the same Ruby
# source files used by Rails; this layer replaces only database and HTTP access.
(Dir['/app/gems/*/lib']+Dir['/app/gems/*/lib/concurrent-ruby']).each { |path| $LOAD_PATH.unshift(path) }
require 'date'
require 'json'
require 'base64'
require 'pathname'
require 'set'
require 'fileutils'
require 'active_support'
require 'active_support/core_ext/object/blank'
require 'active_support/core_ext/hash'
require 'active_support/core_ext/string/filters'
require 'active_support/core_ext/string/access'
require 'active_support/core_ext/array/grouping'
require 'active_support/time'
require 'tzinfo/data'
require 'icalendar'
require 'prawn'
require 'prawn/table'
I18n.load_path = ['/app/config/sl.yml','/app/config/sl.rb']
I18n.default_locale = :sl
require 'i18n/backend/pluralization'
I18n::Backend::Simple.include(I18n::Backend::Pluralization)
Time.zone = 'Europe/Ljubljana'
module Rails
  def self.root = Pathname.new('/app')
end
module PackageImporter
  def self.read(name) = JSON.parse(File.read("/app/data/source/#{name}.json"))
end
class PortableRows < Array
  def where(**conditions)
    self.class.new(select { |row| conditions.all? { |key,value| value.is_a?(Range) ? value.cover?(row.public_send(key)) : row.public_send(key)==value } })
  end
  def order(*keys) = self.class.new(sort_by { |row| keys.map { |key| row.public_send(key) } })
  def ordered = order(:on,:key)
  def pluck(*keys) = map { |row| keys.length==1 ? row.public_send(keys.first) : keys.map { |key| row.public_send(key) } }
  def exists?(**conditions) = where(**conditions).any?
end
class PortableRecord
  def initialize(data) = @data=data.transform_keys(&:to_sym)
  def method_missing(key,*args) = @data.fetch(key) { super }
  def respond_to_missing?(key,include_private=false) = @data.key?(key)||super
  def local_time = instant.in_time_zone('Europe/Ljubljana')
end
class CalendarEvent
  def self.all = @all ||= PortableRows.new(JSON.parse(File.read('/app/data/events.json')).map { |data| PortableRecord.new(data.merge('on'=>Date.iso8601(data['on']))) })
  def self.where(**conditions) = all.where(**conditions)
end
class AstronomicalEvent
  def self.all = @all ||= PortableRows.new(JSON.parse(File.read('/app/data/astronomy.json')).map { |data| PortableRecord.new(data.merge('instant'=>Time.iso8601(data['instant']))) })
  def self.where(**conditions) = all.where(**conditions)
end
class PersonName
  def self.fold(s) = I18n.transliterate(s.to_s.unicode_normalize(:nfc)).downcase
end
class PrivatePhoto
  def self.path(photo,bw:false) = Pathname.new(bw ? '/tmp/photo-gray.jpg' : '/tmp/photo.jpg')
end
class Hash
  def permit(*keys,**nested) = slice(*(keys+nested.keys)).with_indifferent_access
  def require(key) = fetch(key) { raise ArgumentError,'Manjkajo zahtevani podatki.' }
  def to_unsafe_h = self
end
class ApplicationController
  def self.rate_limit(**options); end
  def self.rescue_from(*args,**options); end
  def initialize(data) = @params=data.with_indifferent_access
  def params = @params
  attr_reader :response
  def render(json:,**options) = @response=json
  def send_data(body,**options) = @response={binary:Base64.strict_encode64(body),mime:options[:type],filename:options[:filename]}
end
%w[calendar_engine zodiac ics_service planner_calendar important_days holiday_year input_error print_catalog print_glyphs].each { |name| require "/app/services/#{name}" }
require '/app/services/print_layouts/annual'
require '/app/services/print_layouts/worksheet'
require '/app/services/pdf_renderer'
require '/app/controllers/tools_controller'
module PortableApplication
  ROUTES={'/izracun/'=>:calculate,'/ics/izvoz/'=>:export_ics,'/ics/uvoz/'=>:import_ics,'/planer/ics/'=>:planner_ics}.freeze
  def self.call(path,data)
    if path=='/izvozi/' || path=='/zasebni-predogled/'
      raw=data.fetch('options')
      options=PrintCatalog.normalize(raw)
      if data['photo']
        FileUtils.mkdir_p('/tmp')
        File.binwrite('/tmp/photo.jpg',Base64.strict_decode64(data['photo'].fetch('color')))
        File.binwrite('/tmp/photo-gray.jpg',Base64.strict_decode64(data['photo'].fetch('gray')))
        options['photo']='local-photo'
      end
      FileUtils.mkdir_p('/tmp')
      proof=PdfRenderer.new(options).render('/tmp/calendar.pdf')
      return {pdf:Base64.strict_encode64(File.binread('/tmp/calendar.pdf')),proof:proof,options:options.except('photo'),filename:PrintCatalog.filename(options),identity:PrintCatalog.identity(options),source_version:PrintCatalog.source_version(options)}
    end
    controller=ToolsController.new(data)
    controller.public_send(path.match?(%r{\A/prazniki/20(?:27|28|29|30)\.ics\z}) ? :holidays_ics : ROUTES.fetch(path))
    controller.response
  end
  def self.json(path,text)
    JSON.generate({ok:true,result:call(path,JSON.parse(text))})
  rescue ArgumentError,TypeError,KeyError=>error
    JSON.generate({ok:false,error:InputError.message(error)})
  end
end
