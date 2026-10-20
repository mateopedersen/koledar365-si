class CityCatalog
  def self.all = @all ||= JSON.parse(Rails.root.join('data/cities_sl.json').read).fetch('cities').sort_by { |c| ActiveSupport::Inflector.transliterate(c['name']).downcase }
  def self.find(id) = all.find { |c| c['id']==id } || raise(ActiveRecord::RecordNotFound)
  def self.default = find('ljubljana')
end
