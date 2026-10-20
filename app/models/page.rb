class Page < ApplicationRecord
  scope :published, -> { where(status: "published") }
  validates :path, presence: true, uniqueness: true
end
