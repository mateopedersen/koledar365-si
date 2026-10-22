require_relative '../lib/seo_publication'
root = Pathname.new(File.expand_path('..', __dir__))
puts JSON.generate(SeoPublication.write!(site: root.join('site'), guide: root.join('data/llms-guide.json')))
