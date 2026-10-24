require 'json'
require 'uri'
require 'pathname'

# Find meaningful, crawlable images in the actual canonical HTML, not icons or
# every resolution of a responsive image. Existing curated full-size calendars
# remain in sitemap-pages.xml; the additional image sitemap fills discovery gaps.
module SitemapImages
  EXTENSIONS = %w[.jpg .jpeg .png .gif .webp .avif .svg .bmp].freeze
  EXCLUDED = %w[/visuals/ /assets/ /druzabno/ /horoscope/art/ /studio/].freeze

  def self.walk(value, &block)
    case value
    when Array then value.each { |child| walk(child, &block) }
    when Hash
      yield value
      value.each_value { |child| walk(child, &block) }
    end
  end

  def self.additional(rows, site:, existing:, origin:)
    root = Pathname(site).parent
    aliases = {}
    variants = root.join('data/web_image_variants.json')
    if variants.file?
      JSON.parse(variants.read).each do |original, record|
        walk(record) { |row| row.each_value { |v| aliases[v] = original if v.is_a?(String) && v.start_with?('/') && EXTENSIONS.include?(File.extname(v)) } }
      end
    end
    catalog = Pathname(site).join('free/catalog.json')
    if catalog.file?
      JSON.parse(catalog.read).each do |row|
        files = row['files'] || {}
        aliases[files['preview']] = files['webp'] if files['preview'] && files['webp'].to_s.end_with?('.webp')
      end
    end
    normalize = lambda do |url|
      next unless url.is_a?(String) && !url.empty? && !url.start_with?('data:', 'blob:', '//')
      uri = URI.join(origin + '/', url)
      next unless uri.scheme == 'https' && uri.host == URI(origin).host
      path = aliases.fetch(uri.path, uri.path)
      next unless EXTENSIONS.include?(File.extname(path).downcase) && !EXCLUDED.any? { |prefix| path.start_with?(prefix) }
      next unless Pathname(site).join(path.delete_prefix('/')).file?
      origin + path
    rescue URI::InvalidURIError
      nil
    end
    rows.filter_map do |row|
      candidates = row[:document].css('img[src]').filter_map do |image|
        next if image['alt'].to_s.strip.empty? || image['aria-hidden'] == 'true'
        next if image['class'].to_s.split.any? { |name| %w[ui-icon brand-mark country-flag].include?(name) }
        normalize.call(image['src'])
      end
      # Printable originals are linked downloads, often larger than the preview.
      row[:document].css('a[href]').each do |link|
        candidates << normalize.call(link['href']) unless link.text.strip.empty? && link['aria-label'].to_s.strip.empty?
      end
      row[:document].css('script[type="application/ld+json"]').each do |script|
        walk(JSON.parse(script.text)) do |object|
          candidates << normalize.call(object['contentUrl'] || object['url']) if Array(object['@type']).include?('ImageObject')
        end
      rescue JSON::ParserError
        raise "Invalid image JSON-LD: #{row[:path]}"
      end
      known = (existing[row[:url]] || []).filter_map { |image| image.at_xpath('./*[local-name()="loc"]')&.text }
      images = candidates.compact.uniq - known
      {url: row[:url], images: images, lastmod: row[:lastmod]} unless images.empty?
    end
  end
end
