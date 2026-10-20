Rails.application.configure do
  config.enable_reloading=false
  config.eager_load=ENV['CI'].present?
  config.consider_all_requests_local=true
  config.action_controller.allow_forgery_protection=false
  config.active_storage.service=:test
  config.action_mailer.delivery_method=:test
  config.active_job.queue_adapter=:test
  config.cache_store=:memory_store
  config.secret_key_base='test-key-'*16
end
