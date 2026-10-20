class HolidayPhotoCatalog
  def self.all
    path=Rails.root.join('data/holiday_photos_sl.json')
    path.exist? ? JSON.parse(path.read).fetch('photos',[]) : []
  end
  def self.find(slug) = all.find { |photo| photo['slug']==slug && photo['reviewed']==true }
end
