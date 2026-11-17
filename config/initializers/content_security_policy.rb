Rails.application.config.content_security_policy do |p|
  p.default_src :self
  p.font_src :self
  p.img_src :self, :data, :blob
  p.object_src :none
  p.script_src :self
  p.style_src :self, :unsafe_inline
  p.connect_src :self
  p.frame_src 'https://docs.google.com/forms/'
  p.base_uri :self
  p.form_action :self
  p.frame_ancestors :none
end
Rails.application.config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(24) }
Rails.application.config.content_security_policy_nonce_directives = %w[script-src]
