class AstronomicalEvent < ApplicationRecord
  def local_time = instant.in_time_zone("Europe/Ljubljana")
end
