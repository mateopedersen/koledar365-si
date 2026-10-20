require 'net/http'
require 'time'
class WeatherService
  class Unavailable < StandardError; end
  SOURCE='https://api.met.no/weatherapi/locationforecast/2.0/'
  def self.call(city, now:Time.current)
    dir=Rails.root.join('storage/weather');FileUtils.mkdir_p(dir)
    path=dir.join("#{city.fetch('id')}.json")
    cached=JSON.parse(path.read) if path.file?
    File.open(dir.join("#{city.fetch('id')}.lock"),'w') do |lock|
      lock.flock(File::LOCK_EX)
      cached=JSON.parse(path.read) if path.file?
      if !cached || Time.iso8601(cached['expires_at'])<=now
        begin
          point=city.fetch('coordinates').first
          uri=URI("#{SOURCE}compact?lat=#{point.fetch('lat').round(4)}&lon=#{point.fetch('lon').round(4)}")
          request=Net::HTTP::Get.new(uri)
          request['User-Agent']='Koledar365/1.0 (+https://koledar365.si/kontakt/)'
          request['If-Modified-Since']=cached['last_modified'] if cached && cached['last_modified']
          response=Net::HTTP.start(uri.hostname,uri.port,use_ssl:true,open_timeout:3,read_timeout:6) { |http|http.request(request) }
          expiry=(Time.httpdate(response['Expires']) rescue now+15.minutes)
          expiry=[expiry,now+1.minute].max
          if response.is_a?(Net::HTTPSuccess)
            payload=JSON.parse(response.body)
            raise Unavailable unless payload.dig('properties','timeseries').is_a?(Array)
            cached={'data'=>payload,'fetched_at'=>now.iso8601,'last_modified'=>response['Last-Modified'],'expires_at'=>expiry.iso8601}
          elsif response.is_a?(Net::HTTPNotModified) && cached
            cached['expires_at']=expiry.iso8601;cached['fetched_at']=now.iso8601
          else
            # Back off after upstream errors; never hammer the API or manufacture weather.
            raise Unavailable,"MET Norway HTTP #{response.code}"
          end
          temporary=path.sub_ext(".#{Process.pid}.tmp");temporary.write(JSON.generate(cached));File.rename(temporary,path)
        rescue IOError,SystemCallError,Timeout::Error,JSON::ParserError,Unavailable,OpenSSL::SSL::SSLError=>error
          Rails.logger.warn("Weather unavailable for #{city['id']}: #{error.class}")
          raise Unavailable unless cached
          cached['expires_at']=(now+10.minutes).iso8601
          path.write(JSON.generate(cached))
        end
      end
    end
    updated=Time.iso8601(cached.dig('data','properties','meta','updated_at'))
    raise Unavailable if updated < now-12.hours
    series=cached.dig('data','properties','timeseries')
    current=series.select { |row|Time.iso8601(row['time'])<=now }.last || series.first
    raise Unavailable if (Time.iso8601(current['time'])-now).abs>2.hours
    decorate=lambda do |row|
      details=row.dig('data','instant','details');symbol=row.dig('data','next_1_hours','summary','symbol_code')||row.dig('data','next_6_hours','summary','symbol_code')||'cloudy'
      {at:row['time'],temperature:details['air_temperature'],wind:details['wind_speed'],humidity:details['relative_humidity'],symbol:symbol,description:description(symbol),precipitation:row.dig('data','next_1_hours','details','precipitation_amount')}
    end
    {city:city['id'],city_name:city['name'],current:decorate.call(current),hours:series.select { |r|Time.iso8601(r['time'])>=now }.first(12).map(&decorate),updated_at:updated.iso8601,fetched_at:cached['fetched_at'],expires_at:cached['expires_at'],stale:Time.iso8601(cached['fetched_at'])<now-2.hours,server_now:now.iso8601,source:'MET Norway',license:'CC BY 4.0',kind:'forecast'}
  end
  def self.description(symbol)
    case symbol
    when /thunder/ then 'Nevihte'
    when /sleet/ then 'Dež s snegom'
    when /snow/ then 'Sneženje'
    when /heavyrain/ then 'Močan dež'
    when /lightrain/ then 'Rahel dež'
    when /rain/ then 'Dež'
    when /fog/ then 'Megla'
    when /clearsky/ then 'Jasno'
    when /fair/ then 'Pretežno jasno'
    when /partlycloudy/ then 'Delno oblačno'
    else 'Oblačno'
    end
  end
end
