class PrintRequest < ApplicationRecord
  validates :fingerprint, presence: true
  def available? = status == "complete" && (expires_at.nil? || expires_at.future?)
end
