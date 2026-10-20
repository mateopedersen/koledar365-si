class WebImageCatalog
  def self.find(path)
    @images ||= JSON.parse(Rails.root.join('data/web_image_variants.json').read)
    @images[path]
  end

  CITY_SIZES = '(max-width:650px) calc(100vw - 18px), (max-width:1000px) 40vw, 320px'.freeze
end
