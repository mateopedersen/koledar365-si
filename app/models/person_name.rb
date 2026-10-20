class PersonName < ApplicationRecord
  scope :published, -> { where(status: "published").order(:priority) }
  validates :name_id, :slug, :exact, presence: true, uniqueness: true
  def path = "/koledar-z-imenom/#{slug}/"
  def self.fold(s) = I18n.transliterate(s.to_s.unicode_normalize(:nfc)).downcase
  def self.search(q)
    f = fold(q)
    where("folded LIKE ?", "%#{sanitize_sql_like(f)}%").order(Arel.sql(sanitize_sql_array(["CASE WHEN exact = ? THEN 0 WHEN folded = ? THEN 1 ELSE 2 END", q, f]))).order(:priority)
  end
end
