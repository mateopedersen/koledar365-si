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
        license_url = photo['license_url'].presence
        license_url ||= 'https://creativecommons.org/publicdomain/mark/1.0/' if photo['license'] == 'Public domain'
        value['license'] ||= license_url if license_url
        value['acquireLicensePage'] ||= photo['source'] if photo['source'].present?
        value['copyrightNotice'] ||= rights_notice(photo)
      elsif OWNED_PREFIXES.any? { |prefix| path.start_with?(prefix) } || value['creditText'].to_s.start_with?('Koledar365')
        value['creator'] ||= {'@type' => 'Organization', 'name' => 'Koledar365'}
        value['creditText'] ||= 'Koledar365'
        value['license'] ||= origin + '/pogoji-uporabe/#gradiva'
        value['acquireLicensePage'] ||= origin + '/kontakt/'
        value['copyrightNotice'] ||= if value['creditText'].match?(/umetn|\bAI\b/i)
          'Ilustracija, ustvarjena z umetno inteligenco. Uporaba po pogojih Koledar365.'
        else
          'Koledar365'
        end
      end
    end
    value
  end

  # A rights notice describes the reviewed license, without claiming that the
  # photographer is necessarily the current copyright owner.
  def self.rights_notice(photo)
    return photo['copyright_notice'] if photo['copyright_notice'].present?
    license = photo['license'].to_s.strip
    return if license.empty?
    rights = case license
    when 'Public domain' then 'Javna domena (Public Domain Mark 1.0).'
    when 'CC0' then 'CC0 1.0 — brez pridržanih avtorskih pravic.'
    else "Uporaba po licenci #{license}."
    end
    author = photo['author'].to_s.strip
    author.empty? ? rights : "#{rights} Navedba vira: #{author}."
  end

  def self.photos
    @photos ||= (HolidayPhotoCatalog.all + CityCatalog.all.map { |city| city['photo'] } + GardenCalendar.photos).compact.each_with_object({}) do |photo, index|
      [photo['local_path'], photo['path'], photo['small_path']].compact.each { |path| index[path] = photo }
    end
  end
end
