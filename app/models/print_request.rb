class PrintRequest < ApplicationRecord
  validates :fingerprint, presence: true, uniqueness: true
  def available? = status == "complete" && (expires_at.nil? || expires_at.future?)
end
