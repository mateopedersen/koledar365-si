class Page < ApplicationRecord
  scope :published, -> { where(status: "published") }
  validates :path, presence: true, uniqueness: true

  def self.display_title(title, path: nil)
    if path&.start_with?('/horoskop/') && (sign = HoroscopeGuide.editorial_for_path(path))
      return "Dnevni horoskop za #{sign.fetch('accusative')}"
    end

    title.sub(/\A(Koledar|Lunin koledar|Delovni dnevi in ure|Pomembni dnevi) – /, '\\1 za ')
      .sub(/\ASončni vzhod in zahod – (.+)\z/, 'Sončni vzhod in zahod (\\1)')
  end

  def display_title = self.class.display_title(title, path: path)
end
