class Admin < ApplicationRecord
  has_secure_password
  validates :password, length: {minimum:14}, if: -> { password.present? }
  validates :email, presence: true, uniqueness: true
end
