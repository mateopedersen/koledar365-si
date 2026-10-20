require 'open3'
require 'timeout'
require 'zip'
class RenderCalendarJob < ApplicationJob
  queue_as :exports
  retry_on StandardError, wait: 5.seconds, attempts: 3 do |job,error|
    PrintRequest.find(job.arguments.first).update!(status:'failed',error:'Izdelava ni uspela. Poskusite znova.')
  end
  limits_concurrency to: 1, key: ->(id) { id }, duration: 15.minutes
  def perform(id)
    request=PrintRequest.find(id)
    return if request.available?
    request.update!(status:'rendering',started_at:Time.current,attempts:request.attempts+1,error:nil)
    destination=Rails.root.join('storage/exports',request.fingerprint)
    temp=Rails.root.join('tmp',"export-#{request.id}-#{SecureRandom.hex(6)}")
    FileUtils.mkdir_p(temp)
    pdf_path=temp.join('koledar.pdf')
    manifest=PdfRenderer.new(request.options).render(pdf_path.to_s)
    paper=PackageImporter.read('print-template-specification')['physical_sizes']['sizes'].find { |p| p['paper']==request.options['paper']&&p['orientation']==request.options['orientation'] }
    bin=ENV.fetch('PDFTOPPM_BIN','pdftoppm')
    webps=[]
    1.upto(manifest[:pages]) do |page|
      prefix=temp.join("stran-#{page}")
      command!(bin,'-f',page.to_s,'-l',page.to_s,'-singlefile','-scale-to-x',paper['width_px'].to_s,'-scale-to-y',paper['height_px'].to_s,'-png',pdf_path.to_s,prefix.to_s)
      webp="#{prefix}.webp"
      command!(ENV.fetch('PYTHON_BIN','python3'),Rails.root.join('bin/png-to-webp').to_s,"#{prefix}.png",webp)
      webps<<webp
      if page==1
        command!(bin,'-f','1','-l','1','-singlefile','-scale-to','600','-png',pdf_path.to_s,temp.join('predogled').to_s)
      end
      File.delete("#{prefix}.png")
    end
    if webps.size>1
      Zip::File.open(temp.join('koledar-webp.zip'),create:true) { |zip| webps.each { |f| zip.add(File.basename(f),f) } }
      raster='koledar-webp.zip'
    else
      FileUtils.mv(webps.first,temp.join('koledar.webp'));raster='koledar.webp'
    end
    manifest.merge!(width_px:paper['width_px'],height_px:paper['height_px'],ppi:600,template_version:PrintCatalog::VERSION,brand:'Koledar365 · koledar365.si',sha256:Digest::SHA256.file(pdf_path).hexdigest)
    temp.join('manifest.json').write(JSON.pretty_generate(manifest))
    FileUtils.mkdir_p(destination.dirname);FileUtils.rm_rf(destination) if destination.exist?;FileUtils.mv(temp,destination)
    request.update!(status:'complete',files:{pdf:'koledar.pdf',webp:raster,preview:'predogled.png',manifest:'manifest.json'},finished_at:Time.current)
  ensure
    FileUtils.rm_rf(temp) if temp&&temp.exist?
  end
  def command!(*args)
    output,status=Timeout.timeout(180) { Open3.capture2e(*args) }
    raise "Renderer failed: #{output.truncate(200)}" unless status.success?
  end
end
