require 'json'
module AdvertisingConfig
  DATA = JSON.parse(File.read(Rails.root.join('data/advertising.json'))).freeze
  EXCLUDED_SECTIONS = %w[home about terms privacy cookie_policy methodology calendar_studio planner school_timetable tool vacation].freeze
  EXCLUDED_PATHS = %w[/kontakt/ /fotografije-in-licence/ /404/ /500/].freeze
  def self.eligible?(section:, path:, noindex: false, not_found: false)
    DATA['enabled'] == true && !noindex && !not_found && !EXCLUDED_SECTIONS.include?(section) && !EXCLUDED_PATHS.include?(path) && !path.start_with?('/upravljanje/', '/prijava/', '/odjava/')
  end
end
