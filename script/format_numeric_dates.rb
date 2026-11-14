# Final presentation pass also covers HTML added by static SEO/admin builders.
# Binary calendars, machine-readable dates, JSON and source data are untouched.
require 'pathname'
require 'json'
require_relative '../app/services/numeric_date_presentation'
require_relative '../lib/publication_revisions'
root = Pathname.new(__dir__).parent
site = root.join(ENV.fetch('STATIC_OUT', 'site'))
revision_file=site.join('page-revisions.json')
revisions=revision_file.file? ? JSON.parse(revision_file.read) : {}
changed = 0
files = site.glob('**/*.html')
files.each do |file|
  original = file.read
  formatted = NumericDatePresentation.html(original)
  next if formatted == original
  file.write(formatted)
  page_path='/'+file.relative_path_from(site).to_s.delete_suffix('index.html')
  if (record=revisions[page_path])
    # Formatting the same date is not a new editorial revision. Keep the
    # existing date only when its pre-format fingerprint was actually verified.
    record.delete('modified_at') unless record['sha256']==PublicationRevisions.fingerprint(original)
    record['sha256']=PublicationRevisions.fingerprint(formatted)
  end
  changed += 1
end
revision_file.write(JSON.pretty_generate(revisions)+"\n") if revision_file.file?
puts JSON.generate(html_files: files.length, compacted_files: changed)
