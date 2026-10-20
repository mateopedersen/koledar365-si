class HoroscopeGuide
  PROFILES = JSON.parse(Rails.root.join('data/horoscope/signs.json').read).map(&:freeze).freeze
  attr_reader :today, :slug
  def initialize(today, slug)
    @today, @slug = today, slug
  end
  def profile = PROFILES.find { |row| row['slug'] == slug }
  def calculator? = slug == 'izracun-znamenja'
  def profiles = PROFILES
  def edition
    @edition ||= begin
      row = JSON.parse(Rails.root.join('public/horoscope/daily.json').read)
      date = Date.iso8601(row.fetch('local_date'))
      raise 'Invalid dated edition' if date > today || row.fetch('signs').keys.sort != Zodiac::SIGNS.keys.sort
      row
    rescue Errno::ENOENT, JSON::ParserError, KeyError, Date::Error, RuntimeError
      { 'signs' => {}, 'sky' => {} }
    end
  end
  def current? = edition['local_date'] == today.iso8601
  def edition_date = edition['local_date'] && Date.iso8601(edition['local_date'])
  def reading(key = slug) = edition.fetch('signs')[key] || {}
  def season
    return unless profile
    @season ||= JSON.parse(Rails.root.join('public/horoscope/seasons-v1.json').read).dig('years', today.year.to_s, slug)
  rescue Errno::ENOENT, JSON::ParserError
    nil
  end
  def profile_data = PROFILES.map { |row| row.slice('slug', 'name', 'rising') }
end
