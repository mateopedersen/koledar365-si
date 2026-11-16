require 'test_helper'
class AdvertisingConfigTest < ActiveSupport::TestCase
  test 'advertising never enters private tools, legal pages or editors' do
    %w[unknown info search home planner school_timetable tool vacation calendar_studio about privacy cookie_policy terms methodology].each do |section|
      assert_not AdvertisingConfig.eligible?(section: section, path: '/')
    end
    %w[/kontakt/ /fotografije-in-licence/ /upravljanje/dogodki/].each do |path|
      assert_not AdvertisingConfig.eligible?(section: 'info', path: path)
    end
    assert_not AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/', noindex: true)
    assert_not AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/', not_found: true)
    assert AdvertisingConfig.eligible?(section: 'shopping_guide', path: '/pomembni-dnevi/crni-petek/')
    assert AdvertisingConfig.eligible?(section: 'calendar', path: '/koledar/2027/')
  end
end

class AdvertisingResponsePolicyTest < ActionDispatch::IntegrationTest
  test 'production-like public response allows creative inline code without a blocking nonce' do
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
      assert_no_match /script-src[^;]*'unsafe-inline'|bauval|nresystems|storageimagedisplay/, response.headers['Content-Security-Policy']
  end
  test 'only public ad pages receive inline policy and query pages retain strict nonce policy' do
    %w[/kontakt/ /zasebnost/ /piskotki/ /druzinski-planer/].each do |path|
      get path
      policy = response.headers['Content-Security-Policy']
      assert policy.present?
      # Private and legal responses retain the original strict nonce policy.
      assert_no_match /script-src[^;]*'unsafe-inline'/, policy
      assert_no_match /bauval|nresystems|storageimagedisplay/, policy
      assert_match /'nonce-/, policy
    end
    get '/pomembni-dnevi/crni-petek/?q=private'
    assert_no_match /data-advertising-slot/, response.body
    assert_no_match /script-src[^;]*'unsafe-inline'/, response.headers['Content-Security-Policy']
  end
end
