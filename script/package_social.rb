require_relative '../config/environment'
require 'nokogiri'
require 'pathname'
require 'set'
require 'uri'

site=Rails.root.join('site')
referenced=Set.new
Dir[site.join('**/*.html')].each do |file|
 document=Nokogiri::HTML(File.read(file))
 document.css('meta[property="og:image"],meta[name="twitter:image"]').each do |node|
  value=node['content'].to_s
  next if value.empty?
  uri=URI.parse(value)
  next unless uri.host=='koledar365.si'
  next unless uri.path.start_with?('/druzabno/pages/') && uri.path.end_with?('.png')
  referenced << uri.path.delete_prefix('/')
 end
end

Page.find_each do |page|
 path=site.join('druzabno/pages',page.id.to_s,SocialImage.key(page)+'.png')
 relative=path.relative_path_from(site).to_s
 next unless referenced.include?(relative)
 FileUtils.mkdir_p(path.dirname)
 SocialImage.render(page,path) unless path.file?
end

missing=referenced.reject { |relative|site.join(relative).file? }
raise "Missing referenced social-card images: #{missing.first(10).join(', ')}" unless missing.empty?

files=Dir[site.join('druzabno/pages/**/*.png')]
stale=files.reject { |file|referenced.include?(Pathname.new(file).relative_path_from(site).to_s) }
stale.each { |file|File.delete(file) }
Dir[site.join('druzabno/pages/**/')].sort_by { |directory|-directory.length }.each do |directory|
 Dir.rmdir(directory) if File.directory?(directory) && Dir.empty?(directory)
end
puts({referenced_social_cards:referenced.size,removed_stale_cards:stale.size}.to_json)
