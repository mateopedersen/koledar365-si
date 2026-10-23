# Editorial additions for the fifteen specialist calendars. Existing event data
# remains the source of truth for every date, filter and calendar download.
class TopicExperience
  def self.data = @data ||= JSON.parse(Rails.root.join('data/topic_experiences_sl.json').read)
  def self.page(path) = data.fetch('pages')[path]
  def self.paths = data.fetch('pages').keys
end
