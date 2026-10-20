require "test_helper"
require "tmpdir"
require Rails.root.join("lib/daily_log_device")

class DailyLogDeviceTest < ActiveSupport::TestCase
  test "old logs disappear at the next write and recent logs remain" do
    Dir.mktmpdir do |dir|
      now = Time.utc(2026, 10, 20, 12)
      sink = DailyLogDevice.new(directory: dir, prefix: "test", clock: -> { now })
      sink.write("private request\n")
      now += 6.days
      sink.write("recent request\n")
      assert File.file?(File.join(dir, "test-2026-10-20.log"))
      now += 1.day
      sink.write("today\n")
      refute File.exist?(File.join(dir, "test-2026-10-20.log"))
      assert_equal "today\n", File.read(File.join(dir, "test-2026-10-27.log"))
      assert File.file?(File.join(dir, "test-2026-10-26.log"))
    end
  end
end
