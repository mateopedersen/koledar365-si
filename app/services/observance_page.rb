class ObservancePage
  RELIGIOUS = %w[velika-noc binkosti marijino-vnebovzetje bozic sveti-trije-kralji cvetna-nedelja veliki-petek advent miklavz spomin-vseh-vernih-rajnih].freeze
  MEMORIAL = %w[dan-spomina-na-mrtve dan-spomina-na-zrtve-holokavsta evropski-dan-spomina-na-zrtve-totalitarnih-rezimov].freeze
  attr_reader :slug, :events, :photo, :coincidences

  def initialize(slug)
    @slug = slug
    @events = CalendarEvent.where(slug:slug,on:Date.new(2027,1,1)..Date.new(2030,12,31)).ordered.to_a
    raise ActiveRecord::RecordNotFound if events.empty?
    @photo = HolidayPhotoCatalog.find(slug)
    @coincidences = CalendarEvent.where(work_free:true,on:events.map(&:on)).where.not(slug:slug).group_by(&:on)
  end

  def by_year = events.group_by { |event|event.on.year }
  def lead = TopicContent.body(slug).split(/(?<=[.!?])\s+(?=[[:upper:]])/).first
  def fixed? = by_year.values.map { |rows|rows.map { |event|event.on.strftime('%m-%d') } }.uniq.size==1
  def legal? = events.first.category=='legal'
  def free? = events.all?(&:work_free)
  def state? = events.any?(&:state_holiday)
  def theme
    return 'memorial' if MEMORIAL.include?(slug)
    return 'faith' if RELIGIOUS.include?(slug)
    return 'nature' if events.first.category.match?(/environment|astronomical/) || slug=='dan-triglava'
    return 'civic' if legal?
    return 'community' if events.first.category.match?(/international|european/)
    'tradition'
  end
  def category
    return 'Državni praznik' if state?
    return 'Verski praznik' if RELIGIOUS.include?(slug)
    return 'Spominski dan' if MEMORIAL.include?(slug)
    return 'Astronomski dogodek' if events.first.category=='astronomical'
    return 'Premik ure' if events.first.category=='civil_time'
    return 'Mednarodni dan' if events.first.category.start_with?('international')
    return 'Evropski dan' if events.first.category.start_with?('european')
    'Slovensko izročilo in pomembni dnevi'
  end
  def status = free? ? 'Zakonsko dela prost dan' : 'Sam po sebi ni dela prost dan'
  def related
    rows=CalendarEvent.where(on:Date.new(2027,1,1)..Date.new(2027,12,31),category:events.first.category).where.not(slug:slug).ordered.to_a
    rows.sort_by { |event| [(event.on-events.first.on).to_i.abs,event.on] }.uniq(&:slug).first(4)
  end
end
