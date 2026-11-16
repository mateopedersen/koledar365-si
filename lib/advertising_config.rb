require 'json'
module AdvertisingConfig
  DATA = JSON.parse(File.read(Rails.root.join('data/advertising.json'))).freeze
  PUBLIC_SECTIONS = %w[name names shopping_guide garden_calendar payment_calendar education_calendar moon_phases astronomy_events calendar horoscope school lunar sun workdays holidays important_days seasons events observance tools_index].freeze
  EXCLUDED_PATHS = %w[/kontakt/ /fotografije-in-licence/ /404/ /500/].freeze
  def self.eligible_request?(request)
    controller = request.env['action_controller.instance']
    request.query_string.empty? && controller && eligible?(section: controller.instance_variable_get(:@section), path: request.path, noindex: controller.instance_variable_get(:@noindex), not_found: controller.instance_variable_get(:@not_found))
  end
  def self.eligible?(section:, path:, noindex: false, not_found: false)
    DATA['enabled'] == true && !noindex && !not_found && PUBLIC_SECTIONS.include?(section) && !EXCLUDED_PATHS.include?(path) && !path.start_with?('/upravljanje/', '/prijava/', '/odjava/')
  end
end
