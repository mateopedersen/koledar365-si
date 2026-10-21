require 'digest'
require 'fileutils'
require 'thread'
require 'uri'
require 'nokogiri'

# Keep SVG URLs content-addressed even when the public filename is stable.
module SvgAssetReferences
  XLINK_NAMESPACE = 'http://www.w3.org/1999/xlink'.freeze
  SVG_NAMESPACE = 'http://www.w3.org/2000/svg'.freeze
  UI_SPRITE_PATH = '/visuals/ui-material-v3.svg'.freeze
  UI_PAINT_DEFS_ATTRIBUTE = 'data-k365-ui-paint-defs'.freeze
  VERSION_CACHE = {}
  PAINT_DEFS_CACHE = {}
  VERSION_CACHE_LOCK = Mutex.new

  def self.fingerprinted_path(public_root, path)
    unless path.start_with?('/') && path.end_with?('.svg') && !path.split('/').include?('..')
      raise ArgumentError, 'SVG asset path must be a local absolute path'
    end

    digest = VERSION_CACHE_LOCK.synchronize do
      VERSION_CACHE[path] ||= begin
        asset = File.join(public_root, path.delete_prefix('/'))
        raise "Missing SVG asset: #{path}" unless File.file?(asset)

        Digest::SHA256.file(asset).hexdigest[0, 16]
      end
    end
    path.sub(/\.svg\z/, ".#{digest}.svg")
  end

  def self.versioned_url(public_root, path)
    fingerprinted_path(public_root, path)
  end

  def self.materialize_fingerprinted_assets!(public_root, output_root)
    sources = Dir[File.join(public_root, '**/*.svg')]
    source_urls = sources.map { |source|"/#{source.delete_prefix(public_root.to_s + File::SEPARATOR)}" }
    current_urls = sources.map { |source|fingerprinted_path(public_root, "/#{source.delete_prefix(public_root.to_s + File::SEPARATOR)}") }

    sources.each do |source|
      relative = source.delete_prefix(public_root.to_s + File::SEPARATOR)
      destination = File.join(output_root, fingerprinted_path(public_root, "/#{relative}").delete_prefix('/'))
      FileUtils.mkdir_p(File.dirname(destination))
      FileUtils.cp(source, destination)
    end

    Dir[File.join(output_root, '**/*.svg')].each do |candidate|
      relative = "/#{candidate.delete_prefix(output_root.to_s + File::SEPARATOR)}"
      next if source_urls.include?(relative) || current_urls.include?(relative)
      next unless File.basename(candidate).match?(/\.[a-f0-9]{16}\.svg\z/)

      FileUtils.rm_f(candidate)
    end
  end

  def self.rewrite_document!(document, public_root)
    document.xpath('//*[@src or @href or @*[name()="xlink:href"]]').each do |node|
      %w[src href xlink:href].each do |attribute|
        reference = node[attribute]
        next unless reference&.start_with?('/')

        uri = URI.parse(reference)
        next unless uri.path.end_with?('.svg') && !uri.path.split('/').include?('..')

        asset = File.join(public_root, uri.path.delete_prefix('/'))
        next unless File.file?(asset)

        node[attribute] = "#{fingerprinted_path(public_root, uri.path)}#{uri.fragment ? "##{uri.fragment}" : ''}"
      rescue URI::InvalidURIError
        next
      end
    end

    document.xpath('//*[local-name()="use"]').each do |use|
      reference = use['href'] || use['xlink:href'] || use.attribute_with_ns('href', XLINK_NAMESPACE)&.value
      next unless reference

      use['href'] = reference
      svg = use.ancestors('svg').first
      next unless svg

      svg['xmlns:xlink'] = XLINK_NAMESPACE
      use['xlink:href'] = reference
    end
    inline_ui_sprite_paint_servers!(document, public_root)
    document
  end

  # Safari/WebKit can draw an external <use> symbol's paths while failing to
  # resolve that symbol's url(#paint-server) references from the external file.
  # Keep the shared sprite cached, and expose its small paint definitions in
  # the caller document so the gradients resolve in every browser engine.
  def self.inline_ui_sprite_paint_servers!(document, public_root)
    return document if document.at_css("svg[#{UI_PAINT_DEFS_ATTRIBUTE}]")

    has_external_ui_symbol = document.xpath('//*[local-name()="use"]').any? do |use|
      reference = use['href'] || use['xlink:href'] || use.attribute_with_ns('href', XLINK_NAMESPACE)&.value
      reference && URI.parse(reference).path.match?(%r{\A/visuals/ui-material-v3(?:\.[a-f0-9]{16})?\.svg\z})
    rescue URI::InvalidURIError
      false
    end
    return document unless has_external_ui_symbol

    definitions = PAINT_DEFS_CACHE[public_root.to_s] ||= begin
      sprite_file = File.join(public_root, UI_SPRITE_PATH.delete_prefix('/'))
      raise "Missing SVG sprite: #{UI_SPRITE_PATH}" unless File.file?(sprite_file)

      sprite = Nokogiri::XML(File.read(sprite_file)) { |config| config.strict }
      defs = sprite.at_xpath('/*[local-name()="svg"]/*[local-name()="defs"]')
      raise "Missing paint definitions in SVG sprite: #{UI_SPRITE_PATH}" unless defs

      refs = sprite.xpath('//*[local-name()="symbol"]').flat_map do |symbol|
        symbol.to_xml.scan(/url\(#([^)]+)\)/).flatten
      end.uniq
      definition_ids = defs.element_children.map { |node| node['id'] }.compact
      missing = refs - definition_ids
      raise "SVG sprite has unresolved paint servers: #{missing.join(', ')}" unless missing.empty?

      defs.element_children.map(&:to_xml).join
    end

    body = document.at_css('body')
    return document unless body

    hidden_svg = document.create_element('svg')
    hidden_svg['xmlns'] = SVG_NAMESPACE
    hidden_svg[UI_PAINT_DEFS_ATTRIBUTE] = ''
    hidden_svg['aria-hidden'] = 'true'
    hidden_svg['focusable'] = 'false'
    hidden_svg['width'] = '0'
    hidden_svg['height'] = '0'
    hidden_svg['style'] = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none'
    hidden_svg.inner_html = "<defs>#{definitions}</defs>"
    body.prepend_child(hidden_svg)
    document
  end
end
