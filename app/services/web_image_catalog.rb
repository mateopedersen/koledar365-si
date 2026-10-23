class WebImageCatalog
  def self.find(path)
    @images ||= JSON.parse(Rails.root.join('data/web_image_variants.json').read)
    @images[path]
  end

  CITY_SIZES = '(max-width:650px) calc(100vw - 26px), (max-width:850px) 40vw, (max-width:1250px) 240px, 320px'.freeze
end
