# Apply reviewed image-rights metadata to an existing verified publication.
# Run with `bin/rails runner script/refresh_image_rights.rb`; no image or download
# is regenerated, and the release manifest must be finalized after this step.
require 'json'

origin = 'https://koledar365.si'
changed = 0
objects = 0
pattern = /(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)(.*?)(<\/script>)/mi
Dir[Rails.root.join('site/**/*.html')].sort.each do |file|
  original = File.read(file)
  updated = original.gsub(pattern) do |whole|
    opening, payload, closing = Regexp.last_match.captures
    data = JSON.parse(payload)
    before = JSON.generate(data)
    ImageRights.apply!(data, origin: origin)
    after = JSON.generate(data)
    if before == after
      whole
    else
      objects += 1
      opening + ERB::Util.json_escape(after).to_s + closing
    end
  end
  next if original == updated
  File.write(file, updated)
  changed += 1
end
puts({html_pages_updated: changed, structured_data_blocks_updated: objects}.to_json)
