# Run after generate.mjs: bundle exec rails runner script/astronomy/export_ics.rb
destination = Rails.root.join('public/astronomy')
FileUtils.mkdir_p(destination)
LunarPhaseSchedule::YEARS.each do |year|
  LunarPhaseSchedule::PATHS.each_key do |kind|
    schedule = LunarPhaseSchedule.new(kind: kind, year: year)
    File.write(Rails.root.join('public', schedule.file_path.delete_prefix('/')), AstronomyIcalService.export(AstronomyIcalService.moon_rows(schedule)))
  end
  AstronomySchedule::PATHS.each_key do |kind|
    AstronomySchedule.data.fetch('cities').each do |city|
      schedule = AstronomySchedule.new(kind: kind, city: city.fetch('id'), year: year)
      File.write(Rails.root.join('public', schedule.file_path.delete_prefix('/')), AstronomyIcalService.export(AstronomyIcalService.event_rows(schedule)))
    end
  end
end
puts "Exported #{Dir[destination.join('*.ics')].length} astronomy calendars."
