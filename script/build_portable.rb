require_relative '../config/environment'
require 'fileutils'
root=Rails.root.join('tmp/portable-root')
FileUtils.rm_rf(root);FileUtils.mkdir_p(root)
%w[prawn pdf-core ttfunk matrix prawn-table concurrent-ruby i18n tzinfo tzinfo-data connection_pool activesupport ice_cube icalendar base64 logger securerandom drb].each do |name|
  spec=Gem::Specification.find_by_name(name);dest=root.join('gems',"#{name}-#{spec.version}");FileUtils.mkdir_p(dest)
  FileUtils.cp_r(File.join(spec.full_gem_path,'lib'),dest)
  if name=='ttfunk'
    cff=dest.join('lib/ttfunk/table/cff/dict.rb')
    cff.write(cff.read.sub("require 'bigdecimal'","# Portable build uses only the bundled TrueType fonts; CFF is unavailable."))
  end
  Dir[File.join(spec.full_gem_path,'{LICENSE*,COPYING*,NOTICE*}')].each { |file| FileUtils.cp(file,dest) if File.file?(file) }
end
FileUtils.mkdir_p(root.join('services/print_layouts'));FileUtils.mkdir_p(root.join('controllers'));FileUtils.mkdir_p(root.join('config'));FileUtils.mkdir_p(root.join('data/source'));FileUtils.mkdir_p(root.join('app/assets'))
%w[calendar_engine zodiac ics_service planner_calendar important_days holiday_year input_error print_catalog print_glyphs pdf_renderer].each { |file|FileUtils.cp(Rails.root.join("app/services/#{file}.rb"),root.join('services')) }
FileUtils.cp_r(Rails.root.join('app/services/print_layouts/.'),root.join('services/print_layouts'))
FileUtils.cp_r(Rails.root.join('app/assets/fonts'),root.join('app/assets'))
FileUtils.cp(Rails.root.join('app/controllers/tools_controller.rb'),root.join('controllers'))
FileUtils.cp(Rails.root.join('lib/portable/boot.rb'),root.join('boot.rb'))
FileUtils.cp(Rails.root.join('config/locales/sl.yml'),root.join('config/sl.yml'))
FileUtils.cp(Rails.root.join('config/locales/sl.rb'),root.join('config/sl.rb'))
%w[print-template-specification slovenia-localisation slovenia-additional-observances usno-moon-2027 usno-moon-2028 usno-moon-2029 usno-moon-2030].each { |name|FileUtils.cp(Rails.root.join("data/source/#{name}.json"),root.join('data/source')) }
root.join('data/events.json').write(CalendarEvent.order(:key).map { |row|row.attributes.slice('key','slug','title','on','ends_on','category','work_free','state_holiday','source_url') }.to_json)
root.join('data/astronomy.json').write(AstronomicalEvent.order(:key).map { |row|row.attributes.slice('key','kind','title','instant','source_url') }.to_json)
files=Dir[root.join('**/*')].select { |file|File.file?(file) }.sort
fingerprint=Digest::SHA256.hexdigest(files.map { |file|[Pathname.new(file).relative_path_from(root).to_s,Digest::SHA256.file(file).hexdigest] }.to_json)
Rails.root.join('tmp/portable-fingerprint.txt').write(fingerprint)
puts({root:root.to_s,payload_fingerprint:fingerprint}.to_json)
