class ContactMessage < ApplicationRecord
  validates :name, length: {in: 1..120}
  validates :email, format: {with: URI::MailTo::EMAIL_REGEXP}, length: {maximum: 254}
  validates :message, length: {in: 10..8000}
end
