require_relative '../config/environment'
Page.find_each do |page|
 path=Rails.root.join('site/druzabno/pages',page.id.to_s,SocialImage.key(page)+'.png')
 FileUtils.mkdir_p(path.dirname)
 SocialImage.render(page,path) unless path.file?
end
puts 'Page social PNG files are present.'
