# Audit every canonical page, including presentation added after Rails export.
require 'json'
require 'uri'
require 'nokogiri'
require 'pathname'
require_relative '../app/services/numeric_date_presentation'

root = Pathname.new(__dir__).parent
site = root.join(ENV.fetch('STATIC_OUT', 'site'))
sitemap = Nokogiri::XML(site.join('sitemap-pages.xml').read)
locations = sitemap.xpath('//*[local-name()="url"]/*[local-name()="loc"]').map(&:text)
raise 'Empty canonical sitemap' if locations.empty?
failures = []
scanned_nodes = 0
locations.each do |url|
  path = URI(url).path
  raise "Unexpected canonical URL: #{url}" unless URI(url).host == 'koledar365.si' && path.end_with?('/') && !path.include?('..')
  file = site.join(path.delete_prefix('/'), 'index.html')
  raise "Missing canonical page: #{url}" unless file.file?
  document = Nokogiri::HTML(file.read)
  nodes = document.xpath('//text()').reject do |node|
    node.ancestors.any? { |parent| NumericDatePresentation::EXCLUDED.include?(parent.name) || parent['contenteditable'] }
  end
  nodes += document.xpath('//@aria-label | //@title | //img/@alt')
  nodes.each do |node|
    scanned_nodes += 1
    original = node.content
    replacement = NumericDatePresentation.compact(original)
    next if replacement == original
    failures << { url: url, xpath: node.path, original: original.strip[0, 240], expected: replacement.strip[0, 240] }
  end
end
report = { passed: failures.empty?, canonical_pages: locations.length, inspected_text_and_attributes: scanned_nodes, remaining_spaced_numeric_dates: failures }
output = root.join('evidence/qa/numeric-dates.json')
output.dirname.mkpath
output.write(JSON.pretty_generate(report) + "\n")
puts JSON.generate(report.reject { |key, _| key == :remaining_spaced_numeric_dates }.merge(failure_count: failures.length))
abort "Spaced numeric dates remain; see #{output}" unless failures.empty?
