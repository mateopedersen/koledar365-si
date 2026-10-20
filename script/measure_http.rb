require 'net/http'
paths=%w[/ /koledar/2029/april/ /prazniki/2028/ /prazniki/marijino-vnebovzetje/ /druzinski-planer/ /pomembni-dnevi/]
rows=paths.map do |path|
  timings=3.times.map do
    start=Process.clock_gettime(Process::CLOCK_MONOTONIC)
    response=Net::HTTP.get_response(URI("http://127.0.0.1:3650#{path}"))
    raise "HTTP #{response.code}" unless response.code=='200'
    {ms:((Process.clock_gettime(Process::CLOCK_MONOTONIC)-start)*1000).round(2),html_bytes:response.body.bytesize}
  end
  {path:path,first_request:timings.first,warm_requests:timings.drop(1)}
end
report={checked_at:Time.current.iso8601,environment:'Local Rails development, loopback network, no CPU/network throttle, 3 sequential HTTP requests per route',scope:'Server HTML response latency only; first request is not a controlled cold process. Does not measure LCP, INP or CLS and is not field data.',rows:rows}
Rails.root.join('evidence/http-performance.json').write(JSON.pretty_generate(report));puts report.to_json
