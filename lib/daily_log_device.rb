require "date"
require "fileutils"

# Each write opens the current UTC-day file; concurrent web/worker processes
# append without retaining a handle to a file that cleanup has removed.
class DailyLogDevice
  def initialize(directory:, prefix:, clock: -> { Time.now.utc })
    @directory, @prefix, @clock = directory.to_s, prefix, clock
    FileUtils.mkdir_p(@directory)
    @mutex = Mutex.new
  end

  def write(message)
    @mutex.synchronize do
      day = @clock.call.utc.to_date
      self.class.prune(@directory, now: @clock.call) if @pruned_on != day
      @pruned_on = day
      File.open(File.join(@directory, "#{@prefix}-#{day}.log"), "ab", 0o600) { |f| f.write(message) }
    end
  end

  def close; end
  def flush; end

  def self.prune(directory, now: Time.now.utc)
    cutoff_day = now.utc.to_date - 6
    Dir.glob(File.join(directory.to_s, "*.log*")).each do |path|
      next unless File.file?(path)
      dated = File.basename(path).match(/\A(?:development|production|test)-(\d{4}-\d{2}-\d{2})\.log\z/)
      expired = dated ? Date.iso8601(dated[1]) < cutoff_day : File.mtime(path) < now - 7 * 86_400
      File.delete(path) if expired
    rescue Errno::ENOENT
      # Another application process may have pruned the same file.
    end
  end
end
