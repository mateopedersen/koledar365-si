require 'net/http'
require 'nokogiri'
paths=Page.order(:id).pluck(:path)+PersonName.order(:priority).limit(200).map(&:path)
results=paths.map do |path|
  start=Process.clock_gettime(Process::CLOCK_MONOTONIC)
  response=Net::HTTP.get_response(URI("http://127.0.0.1:3650#{path}"))
  dom=Nokogiri::HTML(response.body)
  {path:path,status:response.code.to_i,h1:dom.css('h1').size,title:dom.at_css('title')&.text,canonical:dom.at_css('link[rel=canonical]')&.[]('href'),milliseconds:((Process.clock_gettime(Process::CLOCK_MONOTONIC)-start)*1000).round(1),error:dom.at_css('#exception-message-for-copy')&.text&.slice(0,300)}
end
Rails.root.join('evidence/route-audit.json').write(JSON.pretty_generate(results))
puts({total:results.size,bad:results.select { |r| r[:status]!=200||r[:h1]!=1 },max_ms:results.map { |r|r[:milliseconds] }.max}.to_json)
