ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
require 'rails/test_help'
PackageImporter.run!
class ActiveSupport::TestCase
  self.use_transactional_tests = true
end
