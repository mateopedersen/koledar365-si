class CalendarEvent < ApplicationRecord
  scope :ordered, -> { order(:on, :title) }
end
