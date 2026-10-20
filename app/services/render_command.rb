require 'open3'
require 'timeout'
class RenderCommand
  def self.run!(*args,timeout:180)
    output=''
    Open3.popen2e(*args,pgroup:true) do |stdin,stdout,wait|
      stdin.close
      reader=Thread.new { stdout.read }
      begin
        status=Timeout.timeout(timeout) { wait.value }
        output=reader.value
        raise "Renderer failed: #{output.truncate(200)}" unless status.success?
      rescue Timeout::Error
        Process.kill('TERM',-wait.pid) rescue nil
        begin
          Timeout.timeout(2) { wait.value }
        rescue Timeout::Error
          Process.kill('KILL',-wait.pid) rescue nil
          wait.value
        end
        raise 'Izdelava je presegla dovoljeni čas.'
      ensure
        reader.join(2)
      end
    end
    output
  end
end
