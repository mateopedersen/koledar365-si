class EditorialCatalog
  HUB = '/blog/'
  TITLE = 'Vodniki za koledar in načrtovanje'
  DESCRIPTION = 'Praktični slovenski vodniki o praznikih, delovnih dneh, šolskem koledarju, tisku in opazovanju neba.'
  CREDIT = 'Uredništvo Koledar365'

  def self.read(name)
    JSON.parse(Rails.root.join("data/blog/#{name}.json").read)
  end

  def self.articles = (@articles ||= read('articles').freeze)
  def self.sources = (@sources ||= read('sources').freeze)
  def self.notes = (@notes ||= read('topic_notes').freeze)
  def self.path(slug) = "#{HUB}#{slug}/"
  def self.article(pathname)
    return unless pathname.start_with?(HUB)

    articles[pathname.delete_prefix(HUB).delete_suffix('/')]
  end

  def self.image(slug) = "/images/blog/#{slug}.webp"

  def self.apply!
    rows = { HUB => { 'title' => TITLE, 'description' => DESCRIPTION } }
    articles.each { |slug, record| rows[path(slug)] = record }
    Page.transaction do
      rows.each do |pathname, record|
        page = Page.find_or_initialize_by(path: pathname)
        page.assign_attributes(title: record.fetch('title'), description: record.fetch('description'), family: 'blog', status: 'published')
        page.save! if page.changed?
      end
    end
  end
end
