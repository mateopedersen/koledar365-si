require 'test_helper'
class CityTest < ActiveSupport::TestCase
  test 'all 69 official cities have an attributed photograph and plausible coordinates' do
    assert_equal 69,CityCatalog.all.size
    assert_equal 69,CityCatalog.all.map { |c|c['id'] }.uniq.size
    CityCatalog.all.each do |city|
      point=city['coordinates'].first
      assert (45.4..46.9).cover?(point['lat']),city['name']
      assert (13.3..16.7).cover?(point['lon']),city['name']
      photo=city['photo']
      assert photo['author'].present?,city['name']
      assert photo['source'].start_with?('https://commons.wikimedia.org/wiki/File:'),city['name']
      assert photo['license'].match?(/\ACC BY|\ACC0\z|\APublic domain\z/),city['name']
      path=Rails.root.join('public',photo['local_path'].delete_prefix('/'))
      assert_equal "\xff\xd8\xff".b,path.binread(3),city['name']
    end
  end
  test 'cached forecast is tied to its city and outdated weather is never presented as current' do
    now=Time.zone.local(2026,10,20,12)
    city=CityCatalog.default.merge('id'=>"test-#{SecureRandom.hex(10)}")
    dir=Rails.root.join('storage/weather');FileUtils.mkdir_p(dir);path=dir.join("#{city['id']}.json")
    payload={'fetched_at'=>now.iso8601,'expires_at'=>(now+1.hour).iso8601,'data'=>{'properties'=>{'meta'=>{'updated_at'=>(now-30.minutes).iso8601},'timeseries'=>[{'time'=>now.iso8601,'data'=>{'instant'=>{'details'=>{'air_temperature'=>13.5,'wind_speed'=>2,'relative_humidity'=>70}},'next_1_hours'=>{'summary'=>{'symbol_code'=>'partlycloudy_day'}}}}]}}}
    path.write(JSON.generate(payload))
    result=WeatherService.call(city,now:now)
    assert_equal city['id'],result[:city]
    assert_equal 13.5,result[:current][:temperature]
    assert_equal 'Delno oblačno',result[:current][:description]
    assert_equal 'forecast',result[:kind]
    future=payload['data']['properties']['timeseries'].first.deep_dup
    future['time']=(now+1.hour).iso8601
    future['data']['instant']['details']['air_temperature']=7
    future['data']['next_1_hours']['summary']['symbol_code']='clearsky_night'
    payload['data']['properties']['timeseries'] << future
    path.write(JSON.generate(payload))
    result=WeatherService.call(city,now:now+40.minutes)
    assert_equal 13.5,result[:current][:temperature], 'Do not show the next hour or its night symbol before that interval starts'
    assert_equal 'partlycloudy_day',result[:current][:symbol]
    payload['data']['properties']['meta']['updated_at']=(now-24.hours).iso8601
    path.write(JSON.generate(payload))
    assert_raises(WeatherService::Unavailable) { WeatherService.call(city,now:now) }
  ensure
    FileUtils.rm_f(path) if path
    FileUtils.rm_f(dir.join("#{city['id']}.lock")) if dir&&city
  end
end
