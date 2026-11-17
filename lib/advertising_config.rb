require 'json'
module AdvertisingConfig
  DATA = JSON.parse(File.read(Rails.root.join('data/advertising.json'))).freeze
  def self.enabled?
    DATA['enabled'] == true && DATA['mode'] == 'sponsored-link' && DATA['directLink'].to_s.match?(%r{\Ahttps://asiafilm\.org/4/[a-f0-9]{32}\z})
  end
  def self.eligible_request?(request)
    controller = request.env['action_controller.instance']
    request.query_string.empty? && controller && eligible?(section: controller.instance_variable_get(:@section), path: request.path, noindex: controller.instance_variable_get(:@noindex), not_found: controller.instance_variable_get(:@not_found))
  end
  def self.eligible?(section:, path:, noindex: false, not_found: false)
    enabled? && !not_found && !%w[/404/ /500/].include?(path) && !path.start_with?('/upravljanje/', '/prijava/', '/odjava/')
  end
end
