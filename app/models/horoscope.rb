class Horoscope < ApplicationRecord
  validates :sign, inclusion: {in: Zodiac::SIGNS.keys}
  validates :body, length: {in: 60..8000}
  validates :local_date, presence: true
  scope :visible, -> { where(status: "published").where("local_date <= ? AND published_at <= ?", Time.zone.today, Time.current) }
  def self.publish_due!
    where(status: "scheduled").where("local_date <= ?", Time.zone.today).find_each do |h|
      h.update!(status: "published", published_at: Time.current)
    end
  end
end
