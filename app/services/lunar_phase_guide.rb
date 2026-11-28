# Provenance for photographed examples is also used on the public credits page.
module LunarPhaseGuide
  PATH = '/lunine-mene/'.freeze
  NEW_MOON_PATH = '/mlaj/'.freeze
  LICENSES_PATH = '/fotografije-in-licence/#fotografije-luninih-men'.freeze
  NEW_MOON_LICENSES_PATH = '/fotografije-in-licence/#fotografije-mlaja'.freeze
  DATA = JSON.parse(Rails.root.join('data/astronomy/moon_phase_guide.json').read).freeze

  def self.hero = DATA.fetch('hero')
  def self.phases = DATA.fetch('phases')
  def self.new_moon_photos = DATA.fetch('new_moon_photos')
  def self.new_moon_hero = new_moon_photos.fetch('mlaj-iss')
  def self.photos = { 'luna-nad-piranom' => hero }.merge(phases.filter_map { |phase| [phase.fetch('id'), phase['photo']] if phase['photo'] }.to_h)
  def self.credit_path(id) = "/fotografije-in-licence/#luna-#{ERB::Util.url_encode(id)}"
end
