# Verify the complete exported site, including lazy-loaded calendar/name fragments.
require 'nokogiri'
require 'json'
require 'set'
require 'digest'
require 'uri'
require 'zlib'
root=File.expand_path('..',__dir__)
site=File.join(root,'site')
verify_png = lambda do |path|
 data=File.binread(path)
 signature="\x89PNG\r\n\x1a\n".b
 raise "#{path}: invalid PNG signature" unless data.start_with?(signature)
 offset=8;idat=+"".b;width=height=nil;saw_ihdr=false;saw_iend=false
 while offset < data.bytesize
  raise "#{path}: truncated PNG chunk" if offset+12>data.bytesize
  length=data.byteslice(offset,4).unpack1('N');type=data.byteslice(offset+4,4)
  chunk_start=offset+8;chunk_end=chunk_start+length
  raise "#{path}: truncated #{type} chunk" if chunk_end+4>data.bytesize
  payload=data.byteslice(chunk_start,length);crc=data.byteslice(chunk_end,4).unpack1('N')
  raise "#{path}: invalid #{type} checksum" unless Zlib.crc32(type+payload)==crc
  if type=='IHDR'
   raise "#{path}: misplaced or repeated IHDR" if saw_ihdr || length!=13 || offset!=8
   width,height,bit_depth,color_type,compression,filter,interlace=payload.unpack('NNC5')
   raise "#{path}: expected 512x512 RGBA PNG" unless width==512 && height==512 && bit_depth==8 && color_type==6 && compression==0 && filter==0 && interlace==0
   saw_ihdr=true
  elsif type=='IDAT'
   idat << payload
  elsif type=='IEND'
   raise "#{path}: malformed IEND" unless length==0
   saw_iend=true;offset=chunk_end+4;break
  end
  offset=chunk_end+4
 end
 raise "#{path}: missing PNG chunks or trailing data" unless saw_ihdr && saw_iend && offset==data.bytesize && !idat.empty?
 decoded=Zlib::Inflate.inflate(idat)
 raise "#{path}: incomplete PNG image data" unless decoded.bytesize==height*(width*4+1)
end
verify_png.call(File.join(root,'public','icon.png'))
verify_png.call(File.join(site,'icon.png'))
sprite='/visuals/ui-material-v3.svg'
xml=Nokogiri::XML(File.read(File.join(site,sprite))) { |c|c.strict }
ids=xml.xpath('//*[@id]').map { |n|n['id'] }
raise 'Duplicate SVG IDs' unless ids.uniq==ids
symbols=xml.xpath('//*[local-name()="symbol"]').map { |n|n['id'] }.to_set
raise 'Incomplete vector collection' unless symbols.size>=38
raise 'Executable SVG content' unless xml.xpath('//*[local-name()="script" or local-name()="foreignObject"]').empty?
xml.xpath('//*[@fill or @stroke]').each do |n|
  [n['fill'],n['stroke']].compact.each { |v| v.scan(/url\(#([^)]+)\)/).flatten.each { |id| raise "Missing material: #{id}" unless ids.include?(id) } }
end
files=Dir[File.join(site,'**/*.html')]
counts=Hash.new(0); failures=[];stylesheet_cache={}
asset_url=lambda do |path|
 # References may already carry the content fingerprint added during the
 # export. Resolve them against the original asset before recomputing it.
 source_path=path.sub(/\.[a-f0-9]{16}\.svg\z/, '.svg')
 asset=File.join(site,source_path.delete_prefix('/'))
 next nil unless File.file?(asset)
 hash=Digest::SHA256.file(asset).hexdigest[0,16]
 fingerprinted=source_path.sub(/\.svg\z/, ".#{hash}.svg")
 next nil unless File.file?(File.join(site,fingerprinted.delete_prefix('/')))
 fingerprinted
end
versioned_ref=lambda do |ref,path|
 expected_path=asset_url.call(path)
 expected_path && URI.parse(ref).path==expected_path
end
files.each do |file|
 html=File.read(file)
 next unless html.include?('class="topbar"')
 counts[:pages]+=1
 doc=Nokogiri::HTML(html)
 page_file=file
 fail_page=lambda { |reason|failures<<{path:page_file.delete_prefix(site),reason:reason} }
 fail_page.call('Missing shared responsive navigation') unless doc.at_css('.subnav.site-navigation [data-navigation-menu]') && doc.css('#site-tools-menu').size==1 && doc.css('.nav-years a').size==4 && doc.css('.nav-shortcut').size==3
 %w[header footer].each do |tag|
  n=doc.at_css("#{tag} .brand-mark")
  fail_page.call("Missing #{tag} logo") unless n && versioned_ref.call(n['src'], '/visuals/brand-calendar-v3.svg') && n['width'] && n['height']
 end
 flag=doc.at_css('.country img.country-flag')
 fail_page.call('Missing or stale fabric flag') unless flag && versioned_ref.call(flag['src'], '/visuals/slovenia-fabric-v3.svg')
 favicon_link=doc.at_css('link[rel="icon"][type="image/png"]')
 fail_page.call('Missing stable square Google-compatible PNG favicon') unless favicon_link && favicon_link['href']=='/icon.png' && favicon_link['sizes']=='512x512'
 fail_page.call('Legacy emoji flag') if doc.at_css('.country')&.text.to_s.include?('🇸🇮')
 styles=doc.css('style').map(&:text)+doc.css('link[rel=stylesheet]').filter_map do |node|
  href=node['href'].split('?',2).first;stylesheet_file=File.join(site,href)
  next unless href.start_with?('/') && File.file?(stylesheet_file)
  stylesheet_cache[href] ||= File.read(stylesheet_file)
 end
 fail_page.call('Missing optical stylesheet') unless styles.any? { |css|css.include?('.brand-mark{') && css.include?('.country-flag{') }
 doc.css('svg.ui-icon').each do |n|
  use=n.at_css('use');ref=use&.[]('href').to_s
  expected_prefix="#{asset_url.call(sprite)}#"
  fail_page.call("Broken or stale icon #{ref}") unless ref.start_with?(expected_prefix) && symbols.include?(ref.split('#',2).last)
  fail_page.call("Missing SVG WebKit fallback #{ref}") unless use && use['xlink:href']==ref && n['xmlns:xlink']=='http://www.w3.org/1999/xlink'
  fail_page.call('Decorative icon exposed to assistive technology') unless n['aria-hidden']=='true'
  counts[:icon_instances]+=1
 end
 doc.css('use[href*="/visuals/"]').each do |n|
  ref=n['href'];svg=n.ancestors('svg').first
  fail_page.call("Unknown or stale SVG symbol #{ref}") unless ref.start_with?("#{asset_url.call(sprite)}#") && symbols.include?(ref.split('#',2).last)
 end
 doc.css('use[href]').each do |n|
  svg=n.ancestors('svg').first
  fail_page.call("Missing SVG WebKit fallback #{n['href']}") unless n['xlink:href']==n['href'] && svg && svg['xmlns:xlink']=='http://www.w3.org/1999/xlink'
 end
 doc.css('img[src],link[href]').select { |node|(node['src'] || node['href']).to_s.include?('.svg') }.each do |node|
  ref=node['src'] || node['href'];next unless ref.start_with?('/')
  path=URI.parse(ref).path
  fail_page.call("Missing or stale SVG version #{ref}") unless versioned_ref.call(ref,path)
 end
 counts[:home_fragments]+=1 if file.include?('/free/views/')
end
raise 'Site export is incomplete' unless counts[:pages]>300
raise 'Removed name pages remain in the static output' if Dir[File.join(site,'koledar-z-imenom/**/*'),File.join(site,'imena/**/*'),File.join(site,'free/names/**/*')].any?
report={passed:failures.empty?,symbols:symbols.size,checked:counts,assets:Dir[File.join(site,'visuals/*.svg')].to_h { |p|[File.basename(p),{bytes:File.size(p),sha256:Digest::SHA256.file(p).hexdigest}] },failures:failures}
File.write(File.join(root,'evidence/vector-identity-audit.json'),JSON.pretty_generate(report))
summary=report.reject { |k,_|[:assets,:failures].include?(k) }
summary[:failure_counts]=failures.group_by { |failure|failure[:reason] }.transform_values(&:length)
summary[:failure_samples]=failures.first(30)
puts JSON.pretty_generate(summary)
abort 'Vector identity audit failed' unless failures.empty?
