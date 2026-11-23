require 'uri'

class SunLocalEditorial
  BASE_PATH = '/soncni-vzhod-in-zahod/'
  USNO_ONE_DAY = 'https://aa.usno.navy.mil/api/rstt/oneday'
  MAPS = 'https://www.e-prostor.gov.si/dostopi/javni-dostop/'

  def self.for(city_id)
    guide = guides[city_id]
    return unless guide

    date = Date.iso8601(guide.fetch('date'))
    here = SunEngine.calculate(date, city_id)
    peer_id = guide.fetch('peer')
    peer = SunEngine.calculate(date, peer_id)
    day = LunarCalendar.date_label(date.iso8601)
    rise, sunset, dawn, dusk = here.values_at(:rise, :set, :civil_dawn, :civil_dusk).map { |time| clock(time) }
    offset = here.fetch(:rise).utc_offset / 3600
    coordinates = [here.fetch(:latitude), here.fetch(:longitude)].join(',')
    primary_url = "#{USNO_ONE_DAY}?#{URI.encode_www_form(date: date.iso8601, coords: coordinates, tz: offset)}"

    {
      'title' => guide.fetch('title'),
      'paragraphs' => [
        guide.fetch('body'),
        "#{day} za referenčno točko #{here.fetch(:name)} model izračuna civilni svit ob #{dawn}, vzhod ob #{rise}, zahod ob #{sunset} in konec civilnega mraka ob #{dusk}. V istem časovnem pasu je za kraj #{peer.fetch(:name)} izračunan vzhod ob #{clock(peer.fetch(:rise))} in zahod ob #{clock(peer.fetch(:set))}."
      ],
      'links' => ["#{BASE_PATH}#{peer_id}/", guide.fetch('related')],
      'sources' => [["Podatki za #{here.fetch(:name)} in izbrani datum (USNO, JSON)", primary_url],
                    ['Javni zemljevidi in prostorski podatki (GURS)', MAPS]]
    }
  end

  def self.description(city_id)
    guide = guides[city_id]
    return unless guide

    city = SunEngine::CITIES.fetch(city_id).first
    title = guide.fetch('title')
    "#{city}: sončni vzhod, zahod in civilni mrak po datumu. #{title}#{'.' unless title.end_with?('?', '!')}"
  end

  def self.guides
    @guides ||= JSON.parse(Rails.root.join('data/astronomy/local_sun_guides_sl.json').read).freeze
  end

  def self.clock(time)
    Time.at((time.to_f / 60).round * 60).getlocal(time.utc_offset).strftime('%H.%M')
  end
  private_class_method :guides, :clock
end
