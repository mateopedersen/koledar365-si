class TopicContent
  def self.body(slug)
    find(slug) || 'Podrobnosti o tem dnevu preverite pri navedenem viru. Koledar prikazuje preverjeni ponavljajoči se datum, ne programa lokalnih dogodkov.'
  end
  def self.find(slug)
    edited=Page.where("path LIKE ?", "%/#{slug}/").where.not(body:[nil,'']).pick(:body)
    return edited if edited.present?
    @bodies ||= JSON.parse(Rails.root.join('data/topics_sl.json').read)
    @bodies[slug]
  end
  def self.references(slug)
    @references ||= JSON.parse(Rails.root.join('data/topic_references_sl.json').read)
    @references.fetch(slug, [])
  end
end
