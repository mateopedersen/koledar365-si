require 'uri'

# Publish only attribution and usage rights present in our reviewed sources.
# An author's credit is not proof of current copyright ownership.
class ImageRights
  OWNED_PREFIXES = %w[/koledarji/2027-2030/ /images/astronomy/ /images/payments/ /images/premik-ure/].freeze

  def self.apply!(value, origin:)
    case value
    when Array then value.each { |child| apply!(child, origin: origin) }
    when Hash
      value.each_value { |child| apply!(child, origin: origin) }
      return value unless Array(value['@type']).include?('ImageObject')
      url = value['contentUrl'] || value['url']
      return value unless url.to_s.start_with?(origin + '/')
      path = URI.parse(url).path
      if (photo = photos[path])
        author = photo['author'].to_s.strip
        unless author.empty?
          kind = author.match?(/\b(?:NASA|ESA|NOAA|Koledar365|FotoBOBO)\b/i) ? 'Organization' : 'Person'
          value['creator'] ||= {'@type' => kind, 'name' => author}
          value['creditText'] ||= author
        end
        value['license'] ||= photo['license_url'] if photo['license_url'].present?
        value['acquireLicensePage'] ||= photo['source'] if photo['source'].present?
        value['copyrightNotice'] ||= photo['copyright_notice'] if photo['copyright_notice'].present?
      elsif OWNED_PREFIXES.any? { |prefix| path.start_with?(prefix) } || value['creditText'].to_s.start_with?('Koledar365')
        value['creator'] ||= {'@type' => 'Organization', 'name' => 'Koledar365'}
        value['creditText'] ||= 'Koledar365'
        value['license'] ||= origin + '/pogoji-uporabe/#gradiva'
        value['acquireLicensePage'] ||= origin + '/kontakt/'
        # AI illustration credit is preserved without inventing exclusive rights.
        value['copyrightNotice'] ||= 'Koledar365' unless value['creditText'].match?(/umetn|\bAI\b/i)
      end
    end
    value
  end

  def self.photos
    @photos ||= (HolidayPhotoCatalog.all + CityCatalog.all.map { |city| city['photo'] } + GardenCalendar.photos).compact.to_h do |photo|
      [photo['local_path'] || photo['path'], photo]
    end
  end
end
