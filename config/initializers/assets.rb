# Be sure to restart your server when you modify this file.

# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = "1.0"

Rails.application.config.assets.precompile += %w[date_calculator.css]
Rails.application.config.assets.precompile += %w[horoscope.css]
Rails.application.config.assets.precompile += %w[countdown.css countdown.js]
Rails.application.config.assets.precompile += %w[sun.css sun.js]
Rails.application.config.assets.precompile += %w[workdays.css workdays.js]
Rails.application.config.assets.precompile += %w[calendar_experience.css astronomy.css astronomy.js]
Rails.application.config.assets.precompile += %w[leap_year.css leap_year.js]

# Add additional assets to the asset load path.
# Rails.application.config.assets.paths << Emoji.images_path
