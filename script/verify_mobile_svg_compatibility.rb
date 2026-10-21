require 'json'
require 'nokogiri'
require 'set'
require 'tmpdir'
require_relative '../lib/svg_asset_references'

root = File.expand_path('..', __dir__)
public_root = File.join(root, 'public')
assert = lambda { |condition, message|raise message unless condition }
page_source_ids = lambda do |document|
  document.xpath('//*[@id]').reject do |node|
    node.ancestors('svg').any? { |ancestor|ancestor[SvgAssetReferences::UI_PAINT_DEFS_ATTRIBUTE] == '' }
  end.map { |node|node['id'] }.to_set
end
assets = Dir[File.join(public_root, '**/*.svg')]
assets.each { |path|Nokogiri::XML(File.read(path)) { |config|config.strict } }
sprite_path = '/visuals/ui-material-v3.svg'
sprite_xml = Nokogiri::XML(File.read(File.join(public_root, sprite_path.delete_prefix('/')))) { |config|config.strict }
sprite_symbols = sprite_xml.xpath('//*[local-name()="symbol"]/@id').map(&:value).to_set
paint_defs = sprite_xml.at_xpath('/*[local-name()="svg"]/*[local-name()="defs"]')
paint_definition_ids = paint_defs.element_children.map { |node|node['id'] }.compact.to_set
paint_server_ids = sprite_xml.xpath('//*[local-name()="symbol"]').flat_map do |symbol|
  symbol.to_xml.scan(/url\(#([^)]+)\)/).flatten
end.to_set
assert.call(paint_server_ids.subset?(paint_definition_ids), 'Every sprite paint server must have a definition')

Dir.mktmpdir('koledar365-svg-assets-') do |fingerprinted_root|
  SvgAssetReferences.materialize_fingerprinted_assets!(public_root, fingerprinted_root)
  fingerprinted_sources = assets.to_h do |asset|
    source_path = "/#{asset.delete_prefix(public_root + File::SEPARATOR)}"
    [SvgAssetReferences.fingerprinted_path(public_root, source_path), source_path]
  end
  assert.call(fingerprinted_sources.length == assets.length, 'Fingerprinted SVG names must be unique')
  fingerprinted_sources.each_key do |path|
    assert.call(File.file?(File.join(fingerprinted_root, path.delete_prefix('/'))), "Missing fingerprinted SVG file: #{path}")
  end

fixture = Nokogiri::HTML(<<~HTML)
  <!doctype html>
  <html><head><link rel="icon" href="/visuals/brand-calendar-v3.svg"></head>
  <body>
    <img src="/school/autumn.svg?old=1">
    <svg xmlns:xlink="http://www.w3.org/1999/xlink"><symbol id="local-icon"><path d="M0 0h1v1z"></path></symbol>
      <use href="/visuals/ui-material-v3.svg#calendar"></use>
      <use xlink:href="/visuals/ui-material-v3.svg#sun"></use>
      <use href="#local-icon"></use>
    </svg>
    <img src="/horoscope/art/bik-v1.svg">
    <a href="https://example.org/logo.svg">External SVG</a>
  </body></html>
HTML

SvgAssetReferences.rewrite_document!(fixture, public_root)
inline_paint_defs = fixture.at_css("svg[#{SvgAssetReferences::UI_PAINT_DEFS_ATTRIBUTE}] defs")
assert.call(inline_paint_defs, 'External sprite paint definitions must be available in the caller document')
assert.call(inline_paint_defs.element_children.map { |node|node['id'] }.to_set == paint_definition_ids,
  'Caller document paint definitions must match the shared UI sprite')
assert.call((page_source_ids.call(fixture) & paint_definition_ids).empty?,
  'Injected paint definition IDs must not count as authored page ID collisions')
collision_fixture = Nokogiri::HTML(<<~HTML)
  <html><body>
    <svg><defs><linearGradient id="k-paper"></linearGradient></defs></svg>
    <svg><use href="/visuals/ui-material-v3.svg#calendar"></use></svg>
  </body></html>
HTML
SvgAssetReferences.rewrite_document!(collision_fixture, public_root)
assert.call((page_source_ids.call(collision_fixture) & paint_definition_ids).include?('k-paper'),
  'Authored paint definition IDs must still be reported as page collisions')
references = fixture.css('img[src],link[href]').to_h do |node|
  reference = node['src'] || node['href']
  [URI.parse(reference).path, reference]
end
%w[/visuals/brand-calendar-v3.svg /school/autumn.svg /horoscope/art/bik-v1.svg].each do |path|
  expected = SvgAssetReferences.versioned_url(public_root, path)
  assert.call(references.values.include?(expected), "SVG URL is not fingerprinted: #{path}")
end
uses = fixture.css('use[href]')
assert.call(uses.length == 3, 'Fixture should contain three use elements')
uses.each do |use|
  svg = use.ancestors('svg').first
  assert.call(use['xlink:href'] == use['href'], "Missing matching legacy reference: #{use['href']}")
  assert.call(svg['xmlns:xlink'] == SvgAssetReferences::XLINK_NAMESPACE, 'Missing xlink namespace')
end
assert.call(fixture.at_css('a[href^="https://example.org/"]')['href'] == 'https://example.org/logo.svg', 'External links must remain unchanged')

mobile_css = File.read(File.join(root, 'app/assets/stylesheets/vector_identity.css'))
assert.call(!mobile_css.include?('filter:saturate(1.18)'), 'Mobile SVG icons must not receive a forced compositing filter')

page_count = 0
symbol_count = 0
svg_reference_count = 0
Dir[File.join(root, 'site/**/*.html')].each do |path|
  page = Nokogiri::HTML(File.read(path))
  id_collisions = page_source_ids.call(page) & paint_definition_ids
  assert.call(id_collisions.empty?, "SVG paint definition ID collision in #{path}: #{id_collisions.to_a.join(', ')}")
  SvgAssetReferences.rewrite_document!(page, public_root)
  external_uses = page.css('use[href]').select { |use|use['href'].include?('ui-material-v3.') }
  if external_uses.any?
    inline_defs = page.at_css("svg[#{SvgAssetReferences::UI_PAINT_DEFS_ATTRIBUTE}] defs")
    assert.call(inline_defs, "Missing Safari paint definitions in #{path}")
    assert.call(inline_defs.element_children.map { |node|node['id'] }.to_set == paint_definition_ids,
      "Incomplete Safari paint definitions in #{path}")
  end
  page.css('use[href]').each do |use|
    svg = use.ancestors('svg').first
    assert.call(use['xlink:href'] == use['href'] && svg && svg['xmlns:xlink'] == SvgAssetReferences::XLINK_NAMESPACE,
      "Missing WebKit fallback in #{path}: #{use['href']}")
    uri = URI.parse(use['href'])
    if uri.path.empty?
      page_ids = page.xpath('//*[@id]').map { |node|node['id'] }
      assert.call(page_ids.include?(uri.fragment), "Missing local SVG symbol in #{path}: #{use['href']}")
    else
      source_path = fingerprinted_sources[uri.path]
      assert.call(source_path == sprite_path && sprite_symbols.include?(uri.fragment),
        "Missing or unknown external SVG symbol in #{path}: #{use['href']}")
    end
    symbol_count += 1
  end
  page.xpath('//*[@src or @href or @*[name()="xlink:href"]]').each do |node|
    %w[src href xlink:href].each do |attribute|
      reference = node[attribute]
      next unless reference&.include?('.svg') && reference.start_with?('/')

      uri = URI.parse(reference)
      source_path = fingerprinted_sources[uri.path]
      next unless source_path

      expected = SvgAssetReferences.versioned_url(public_root, source_path)
      assert.call(uri.path == expected && uri.query.nil? && File.file?(File.join(fingerprinted_root, uri.path.delete_prefix('/'))),
        "Unversioned SVG reference in #{path}: #{reference}")
      svg_reference_count += 1
    end
  end
  page_count += 1
end
assert.call(page_count > 8900, "Expected a full static export, checked only #{page_count} pages")
puts JSON.generate(passed: true, checked_pages: page_count, fingerprinted_svg_references: svg_reference_count,
  fallback_symbols: symbol_count, valid_svg_documents: assets.length)
end
