class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action { response.headers['Cache-Control']='private, no-store' }
  before_action { @noindex = true unless Rails.env.production? }
  after_action { response.headers['X-Robots-Tag']='noindex, follow' if @noindex || !Rails.env.production? }
  after_action do
    if response.media_type == 'text/html' && response.body.is_a?(String)
      response.body = NumericDatePresentation.html(response.body)
      response.delete_header('Content-Length')
    end
  end
  after_action :configure_advertising_content_security_policy
  def configure_advertising_content_security_policy
    return unless response.media_type == 'text/html' && response.status == 200 && AdvertisingConfig.eligible_request?(request)
    policy = request.content_security_policy.clone
    request.content_security_policy = policy
    policy.script_src :self, :unsafe_inline, 'https://bauval.org'
    policy.script_src_attr :none
    policy.frame_src 'https://docs.google.com/forms/', 'https://bauval.org'
    policy.connect_src :self, 'https://bauval.org'
    policy.img_src :self, :data, :blob, 'https://bauval.org', 'https://static.nresystems.com', 'https://cdn.storageimagedisplay.com'
  end
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  def not_found
    @title='Strani ni mogoče najti'; @noindex=true; @not_found=true
    @description='Strani na tem naslovu ni. Poiščite koledar, praznik ali orodje in nadaljujte načrtovanje.'
    response.headers['X-Robots-Tag']='noindex, follow'
    render 'pages/not_found', status: :not_found, formats: [:html]
  end
end
