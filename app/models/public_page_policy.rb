# Consolidate former school landing pages that render the same complete explorer.
# Period-specific calendar pages elsewhere contain distinct dates/downloads.
class PublicPagePolicy
  REDIRECTS = JSON.parse(Rails.root.join('config/public_page_redirects.json').read).freeze

  def self.redirect(path)
    REDIRECTS[path.end_with?('/') ? path : "#{path}/"]
  end
end
