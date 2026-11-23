class TopicContent
  def self.body(slug)
    find(slug) || 'Podrobnosti o tem dnevu preverite pri navedenem viru. Koledar prikazuje preverjeni ponavljajoči se datum, ne programa lokalnih dogodkov.'
  end
  def self.find(slug)
    edited=Page.where("path LIKE ?", "%/#{slug}/").where.not(body:[nil,'']).pick(:body)
    return edited if edited.present?
    added=OccasionCatalog.observance(slug)
    return added.fetch('description') if added
    @bodies ||= JSON.parse(Rails.root.join('data/topics_sl.json').read)
    @bodies[slug] || guides[slug]&.fetch('page_intro',nil)
  end
  def self.guide(slug)
    if (added=OccasionCatalog.observance(slug))
      return added.slice('link_path', 'link_title').merge(
        'text' => added.fetch('practice'), 'source_url' => added.fetch('source_url'),
        'source_title' => added.fetch('source_title'), 'checked_on' => OccasionCatalog.checked_on
      )
    end
    guides[slug]&.merge('checked_on'=>guide_data.fetch('checked_on'))
  end
  def self.guide_data = @guide_data ||= JSON.parse(Rails.root.join('data/observance_guides_sl.json').read)
  def self.guides = guide_data.fetch('topics')
  def self.chapters(slug)
    @chapters ||= JSON.parse(Rails.root.join('data/observance_stories_sl.json').read)
    @chapters.fetch(slug, [])
  end

  def self.references(slug)
    @references ||= JSON.parse(Rails.root.join('data/topic_references_sl.json').read)
    @references.fetch(slug, [])
  end
end
