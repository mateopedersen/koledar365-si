class EditorialJob < ApplicationJob
  def perform
    Horoscope.publish_due!
    missing=Zodiac::SIGNS.keys-Horoscope.visible.where(local_date:Time.zone.today).pluck(:sign)
    AuditLog.create!(action:'horoscope_daily_check',actor:'scheduler',details:{date:Time.zone.today,missing:missing})
  end
end
