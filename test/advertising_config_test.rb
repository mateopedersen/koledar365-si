require 'test_helper'
module AdvertisingFeatureFixture
  def with_advertising_enabled(enabled: true)
    production_config = AdvertisingConfig::DATA
    AdvertisingConfig.send(:remove_const, :DATA)
    AdvertisingConfig.const_set(:DATA, production_config.merge('enabled' => enabled).freeze)
    yield
  ensure
    AdvertisingConfig.send(:remove_const, :DATA)
    AdvertisingConfig.const_set(:DATA, production_config)
  end
end
class AdvertisingConfigTest < ActiveSupport::TestCase
  include AdvertisingFeatureFixture
  test 'all canonical public sections receive advertising; internal and error routes stay excluded' do
    with_advertising_enabled do
      %w[info search home planner school_timetable tool vacation calendar_studio about privacy cookie_policy terms methodology].each do |section|
        assert AdvertisingConfig.eligible?(section: section, path: '/')
      end
      %w[/kontakt/ /fotografije-in-licence/ /druzinski-planer/].each do |path|
        assert AdvertisingConfig.eligible?(section: 'info', path: path)
      end
      %w[/upravljanje/dogodki/ /prijava/ /404/ /500/].each do |path|
        assert_not AdvertisingConfig.eligible?(section: 'info', path: path)
      end
      assert AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/', noindex: true)
      assert_not AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/', not_found: true)
    end
  end
end

class AdvertisingResponsePolicyTest < ActionDispatch::IntegrationTest
  include AdvertisingFeatureFixture
  test 'disabled delivery flag removes public slots and restores strict CSP' do
    with_advertising_enabled(enabled: false) do
    assert_equal false, AdvertisingConfig::DATA['enabled']
    assert_not AdvertisingConfig.enabled?
    get '/pomembni-dnevi/crni-petek/'
    assert_response :success
    assert_no_match /data-advertising-slot/, response.body
    assert_no_match /script-src[^;]*'unsafe-inline'|bauval|nresystems|storageimagedisplay/, response.headers['Content-Security-Policy']
    assert_match /'nonce-/, response.headers['Content-Security-Policy']
    end
  end
  test 'public and query pages retain strict nonce policy without advertising' do
    %w[/kontakt/ /zasebnost/ /piskotki/ /druzinski-planer/].each do |path|
      get path
      policy = response.headers['Content-Security-Policy']
      assert policy.present?
      assert_no_match /data-advertising-slot|advertising-config|data-banner-choice/, response.body
      assert_no_match /script-src[^;]*'unsafe-inline'/, policy
      assert_no_match /bauval|asiafilm/, policy
    end
    get '/pomembni-dnevi/crni-petek/?q=private'
    assert_no_match /data-advertising-slot/, response.body
    assert_no_match /script-src[^;]*'unsafe-inline'/, response.headers['Content-Security-Policy']
  end
end
