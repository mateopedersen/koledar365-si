require 'json'
require 'nokogiri'
require 'pathname'
require 'uri'
require_relative 'publication_revisions'
require_relative 'sitemap_images'

# Build the discovery files from the actual rendered, canonical HTML. Editorial
# database timestamps alone do not date changes to shared templates or datasets.
module SeoPublication
  ORIGIN = 'https://koledar365.si'.freeze
  NS = 'http://www.sitemaps.org/schemas/sitemap/0.9'.freeze

  def self.pages(site)
    Pathname(site).glob('**/*.html').sort.filter_map do |file|
      doc = Nokogiri::HTML(file.read)
      next if doc.css('meta[name="robots"],meta[name="googlebot"]').any? { |n| n['content'].to_s.match?(/\b(noindex|none)\b/i) }
      path = '/' + file.relative_path_from(Pathname(site)).to_s.delete_suffix('index.html')
      raise "Unexpected indexable HTML: #{file}" unless file.basename.to_s == 'index.html'
      canonical = doc.css('link[rel="canonical"]').map { |n| n['href'] }
      raise "Canonical mismatch: #{path}" unless canonical == [ORIGIN + path]
      raise "Private path: #{path}" if path.start_with?('/upravljanje/', '/free/')
      {path: path, url: canonical.first, title: doc.at_css('h1')&.text.to_s.strip, document: doc}
    end
  end

  def self.write!(site:, guide:)
    site = Pathname(site)
    rows = pages(site)
    raise 'Empty public inventory' if rows.empty?
    revisions_file = site.join('page-revisions.json')
    revisions = revisions_file.file? ? JSON.parse(revisions_file.read) : {}
    rows.each do |row|
      record = revisions[row[:path]]
      next unless record && record['modified_at']
      raise "Stale revision evidence: #{row[:path]}" unless record['sha256'] == PublicationRevisions.fingerprint(row[:document].to_html)
      raise "Future revision date: #{row[:path]}" if Time.iso8601(record['modified_at']) > Time.now.utc
      row[:lastmod] = record['modified_at']
    end
    source = Nokogiri::XML(site.join('sitemap-pages.xml').read) { |config| config.strict.nonet }
    images = source.xpath('//*[local-name()="url"]').to_h do |node|
      [node.at_xpath('./*[local-name()="loc"]').text, node.xpath('./*[local-name()="image"]').map(&:dup)]
    end
    xml = Nokogiri::XML::Builder.new(encoding: 'UTF-8') do |x|
      x.urlset('xmlns' => NS, 'xmlns:image' => 'http://www.google.com/schemas/sitemap-image/1.1') do
        rows.each do |row|
          x.url do
            x.loc(row[:url])
            x.lastmod(row[:lastmod]) if row[:lastmod]
            (images[row[:url]] || []).each { |image| x.parent.add_child(image) }
          end
        end
      end
    end
    raise 'Sitemap exceeds protocol limits' if rows.size > 50_000 || xml.to_xml.bytesize > 50 * 1024 * 1024
    site.join('sitemap-pages.xml').write(xml.to_xml)
    additional = SitemapImages.additional(rows, site: site, existing: images, origin: ORIGIN)
    image_xml = Nokogiri::XML::Builder.new(encoding: 'UTF-8') do |x|
      x.urlset('xmlns' => NS, 'xmlns:image' => 'http://www.google.com/schemas/sitemap-image/1.1') do
        additional.each do |row|
          raise 'Too many images on one landing page' if row[:images].size > 1000
          x.url do
            x.loc(row[:url])
            x.lastmod(row[:lastmod]) if row[:lastmod]
            row[:images].each { |image| x['image'].image { x['image'].loc(image) } }
          end
        end
      end
    end
    raise 'Image sitemap exceeds protocol limits' if additional.size > 50_000 || image_xml.to_xml.bytesize > 50 * 1024 * 1024
    site.join('sitemap-images.xml').write(image_xml.to_xml)
    index = Nokogiri::XML::Builder.new(encoding: 'UTF-8') do |x|
      x.sitemapindex('xmlns' => NS) do
        %w[sitemap-pages.xml sitemap-images.xml].each { |file| x.sitemap { x.loc(ORIGIN + '/' + file) } }
      end
    end
    site.join('sitemap.xml').write(index.to_xml)
    data = JSON.parse(Pathname(guide).read)
    by_path = rows.to_h { |row| [row[:path], row] }
    seen = []
    lines = ["# #{data.fetch('name')}", '', "> #{data.fetch('summary')}", '', data.fetch('introduction')]
    data.fetch('sections').each do |section|
      lines.concat(['', "## #{section.fetch('title')}", ''])
      section.fetch('links').each do |path, description|
        row = by_path.fetch(path) { raise "llms.txt target is not canonical/indexable: #{path}" }
        raise "Duplicate llms.txt link: #{path}" if seen.include?(path)
        seen << path
        title = row[:title].gsub(/[\[\]\r\n]/, ' ').gsub(/\s+/, ' ').strip
        raise "Missing guide title/description: #{path}" if title.empty? || description.to_s.strip.empty?
        lines << "- [#{title}](#{row[:url]}): #{description}"
      end
    end
    site.join('llms.txt').write(lines.join("\n") + "\n")
    {sitemap_urls: rows.size, additional_image_pages: additional.size, additional_images: additional.sum { |row| row[:images].size }, llms_links: seen.size, llms_sections: data['sections'].size, lastmod: 'verified page revision history; omitted when unknown', dated_urls: rows.count { |row| row[:lastmod] }}
  end
end
