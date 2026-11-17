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
  test 'production-like public response allows creative inline code without a blocking nonce' do
    with_advertising_enabled do
      get '/pomembni-dnevi/crni-petek/'
      assert_response :success
      assert_match /data-advertising-slot/, response.body
      policy = response.headers['Content-Security-Policy']
      scripts = policy.match(/(?:^|; )script-src ([^;]+)/)[1]
      assert_match /'unsafe-inline'/, scripts
      assert_no_match /nonce-|sha256-/, scripts
      assert_match /script-src-attr 'none'/, policy
      assert_match /cdn.storageimagedisplay.com/, policy
      get '/pomembni-dnevi/crni-petek/?q=private'
      assert_no_match /data-advertising-slot/, response.body
      assert_no_match /script-src[^;]*'unsafe-inline'|bauval|nresystems|storageimagedisplay/, response.headers['Content-Security-Policy']
      get '/kontakt/'
      assert_equal 1, response.body.scan('data-advertising-slot').length
      assert_match /script-src[^;]*'unsafe-inline'/, response.headers['Content-Security-Policy']
    end
  end
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
  test 'approved production provides one public slot without granting private or query permissions' do
    assert_equal true, AdvertisingConfig::DATA['enabled']
    get '/pomembni-dnevi/crni-petek/'
    assert_response :success
    assert_equal 1, response.body.scan('data-advertising-slot').length
    assert_match /script-src[^;]*'unsafe-inline'/, response.headers['Content-Security-Policy']
    get '/pomembni-dnevi/crni-petek/?q=private'
    assert_no_match /data-advertising-slot/, response.body
    assert_no_match /script-src[^;]*'unsafe-inline'|bauval|nresystems|storageimagedisplay/, response.headers['Content-Security-Policy']
  end
  test 'only public ad pages receive inline policy and query pages retain strict nonce policy' do
    %w[/kontakt/ /zasebnost/ /piskotki/ /druzinski-planer/].each do |path|
      get path
      policy = response.headers['Content-Security-Policy']
      assert policy.present?
      assert_equal 1, response.body.scan('data-advertising-slot').length
      assert_match /script-src[^;]*'unsafe-inline'/, policy
      assert_match /bauval/, policy
    end
    get '/pomembni-dnevi/crni-petek/?q=private'
    assert_no_match /data-advertising-slot/, response.body
    assert_no_match /script-src[^;]*'unsafe-inline'/, response.headers['Content-Security-Policy']
  end
end
