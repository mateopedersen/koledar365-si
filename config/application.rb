require_relative "boot"
require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_mailer/railtie"
require "action_controller/railtie"
require "action_view/railtie"
require "rails/test_unit/railtie"
Bundler.require(*Rails.groups)
require_relative "../lib/daily_log_device"
module Koledar365
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks])
    config.time_zone = "Europe/Ljubljana"
    sink = DailyLogDevice.new(directory: File.expand_path("../log", __dir__), prefix: Rails.env)
    config.logger = ActiveSupport::TaggedLogging.new(ActiveSupport::Logger.new(sink))
    config.i18n.default_locale = :sl
    config.i18n.available_locales = [:sl]
    config.active_job.queue_adapter = :solid_queue
    config.solid_queue.connects_to = { database: { writing: :primary } }
    config.filter_parameters += [:password, :message, :email, :birth_date, :notes, :payload, :photo,
      :name, :person, :title, :date, :from, :to, :time, :entries, :events, :ics, :options, :q]
  end
end
