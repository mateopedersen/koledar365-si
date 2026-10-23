# Final presentation pass also covers HTML added by static SEO/admin builders.
# Binary calendars, machine-readable dates, JSON and source data are untouched.
require 'pathname'
require 'json'
require_relative '../app/services/numeric_date_presentation'
root = Pathname.new(__dir__).parent
site = root.join(ENV.fetch('STATIC_OUT', 'site'))
changed = 0
files = site.glob('**/*.html')
files.each do |file|
  original = file.read
  formatted = NumericDatePresentation.html(original)
  next if formatted == original
  file.write(formatted)
  changed += 1
end
puts JSON.generate(html_files: files.length, compacted_files: changed)
