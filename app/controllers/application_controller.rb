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
  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  def not_found
    @title='Strani ni mogoče najti'; @noindex=true; @not_found=true
    @description='Strani na tem naslovu ni. Poiščite koledar, praznik ali orodje in nadaljujte načrtovanje.'
    response.headers['X-Robots-Tag']='noindex, follow'
    render 'pages/not_found', status: :not_found, formats: [:html]
  end
end
