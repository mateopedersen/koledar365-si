# Crawl the complete prepared publication, including cross-page fragment targets.
# This checks the exported HTML; it does not claim Google indexing or language certification.
require 'nokogiri'
require 'json'
require 'uri'
require 'pathname'
require 'set'
require 'time'

root = Pathname.new(File.expand_path('..', __dir__))
site = root.join('site')
prefix = ENV.fetch('AUDIT_PREFIX', 'site-content-audit')
origin = 'https://koledar365.si'
clean = ->(text) { text.to_s.gsub(/\s+/, ' ').strip }
pages = {}
issues = []
corpus = Hash.new { |hash, key| hash[key] = [] }
Dir[site.join('**/*.html')].sort.each do |filename|
  relative = Pathname.new(filename).relative_path_from(site).to_s
  next if relative.start_with?('free/')
  path = relative == 'index.html' ? '/' : '/' + relative.sub(/index\.html\z/, '')
  doc = Nokogiri::HTML(File.read(filename))
  main = doc.at_css('main') || doc
  row = {
    path: path, file: relative, indexable: !doc.at_css('meta[name=robots]')&.[]('content').to_s.include?('noindex'),
    title: clean.call(doc.at_css('title')&.text), description: clean.call(doc.at_css('meta[name=description]')&.[]('content')),
    h1: main.css('h1').map { |node| clean.call(node.text) },
    headings: main.css('h2,h3').map { |node| clean.call(node.text) },
    canonical: doc.css('link[rel=canonical]').map { |node| node['href'] },
    language: doc.at_css('html')&.[]('lang'),
    ids: doc.css('[id]').map { |node| node['id'] },
    links: doc.css('a[href]').map { |node| {href: node['href'], text: clean.call(node['aria-label'] || node.text), alt: node.css('img[alt]').map { |image| image['alt'] }.join(' ')} }
  }
  main.css('h1,h2,h3,p,label,button,th,figcaption,summary').each do |node|
    next if node.ancestors.any? { |parent| %w[script style template].include?(parent.name) }
    text = clean.call(node.text)
    corpus[text] << path unless text.empty? || text.match?(/\A[\d\s.,:–+%°−\/]+\z/)
  end
  main.css('[alt],[aria-label],[title]').each do |node|
    %w[alt aria-label title].each do |attribute|
      value = clean.call(node[attribute])
      corpus[value] << path unless value.empty?
    end
  end
  pages[path] = row
  flag = ->(kind, detail = nil) { issues << {path: path, kind: kind, detail: detail} }
  flag.call('language', row[:language]) unless row[:language] == 'sl-SI'
  flag.call('heading_count', row[:h1]) unless row[:h1].size == 1
  flag.call('missing_metadata') if row[:title].empty? || row[:description].empty?
  flag.call('canonical', row[:canonical]) if row[:indexable] && row[:canonical] != [origin + path]
  duplicate_ids = row[:ids].tally.select { |_, count| count > 1 }.keys
  flag.call('duplicate_ids', duplicate_ids) unless duplicate_ids.empty?
  doc.css('script[type="application/ld+json"]').each do |node|
    begin
      JSON.parse(node.text)
    rescue JSON::ParserError => error
      flag.call('invalid_structured_data', error.message)
    end
  end
  if row[:indexable]
    { 'og:title' => row[:title], 'og:description' => row[:description], 'og:url' => origin + path }.each do |property, expected|
      actual = doc.at_css("meta[property='#{property}']")&.[]('content')
      flag.call('social_metadata_mismatch', property) unless clean.call(actual) == expected
    end
  end
  missing_alt = main.css('img').reject { |node| node.key?('alt') }.map { |node| node['src'] }
  flag.call('missing_image_alt', missing_alt) unless missing_alt.empty?
end

inbound = Hash.new { |hash, key| hash[key] = Set.new }
targets = Set.new
pages.each_value do |row|
  row[:links].each do |link|
    href = link[:href]
    next if href.empty? || href.start_with?('mailto:', 'tel:', 'javascript:', 'data:', 'blob:')
    begin
      url = URI.join(origin + row[:path], href)
      next unless url.host == 'koledar365.si'
      target = URI::DEFAULT_PARSER.unescape(url.path)
      target = '/' if target.empty?
      targets << target
      inbound[target] << row[:path] unless row[:path] == target
      file = site.join(target.delete_prefix('/'))
      file = file.join('index.html') if target.end_with?('/')
      runtime = target.start_with?('/vreme/', '/cdn-cgi/') || %w[/izracun/ /ics/izvoz/ /ics/uvoz/ /planer/ics/ /fotografija/].include?(target)
      unless file.file? || runtime
        issues << {path: row[:path], kind: 'missing_link', detail: href, text: link[:text]}
      end
      if url.fragment && !url.fragment.empty? && pages[target]
        fragment = URI::DEFAULT_PARSER.unescape(url.fragment)
        unless pages[target][:ids].include?(fragment)
          issues << {path: row[:path], kind: 'missing_fragment', detail: href, text: link[:text]}
        end
      end
      if link[:text].empty? && link[:alt].empty?
        issues << {path: row[:path], kind: 'unnamed_link', detail: href}
      end
    rescue URI::Error
      issues << {path: row[:path], kind: 'invalid_link', detail: href}
    end
  end
end
indexable = pages.values.select { |row| row[:indexable] }
%i[title description].each do |field|
  indexable.group_by { |row| row[field] }.each do |text, rows|
    issues << {kind: "duplicate_#{field}", detail: text, paths: rows.map { |row| row[:path] }} if rows.size > 1
  end
end
sitemap_paths = Dir[site.join('sitemap-*.xml')].flat_map do |filename|
  Nokogiri::XML(File.read(filename)).remove_namespaces!.css('url > loc').map { |node| URI(node.text).path }
end.uniq
sitemap_paths.each do |path|
  issues << {path: path, kind: 'sitemap_missing_or_noindex'} unless pages[path]&.dig(:indexable)
end
indexable.each do |row|
  issues << {path: row[:path], kind: 'missing_from_sitemap'} unless sitemap_paths.include?(row[:path])
  issues << {path: row[:path], kind: 'orphan_page'} if row[:path] != '/' && inbound[row[:path]].empty?
end
report = {checked_at: Time.now.utc.iso8601, html_pages: pages.size, indexable_pages: indexable.size, sitemap_urls: sitemap_paths.size,
          distinct_link_targets: targets.size, issue_counts: issues.map { |issue| issue[:kind] }.tally,
          issues: issues, pages: pages.values.map { |row| row.reject { |key, _| %i[ids links].include?(key) }.merge(inbound_pages: inbound[row[:path]].size) }}
root.join("evidence/#{prefix}.json").write(JSON.pretty_generate(report) + "\n")
root.join("tmp/#{prefix}-corpus.json").tap { |file| file.dirname.mkpath; file.write(JSON.pretty_generate(corpus.transform_values(&:uniq))) }
puts JSON.pretty_generate(report.reject { |key, _| %i[issues pages].include?(key) })

exit(issues.empty? ? 0 : 1)
