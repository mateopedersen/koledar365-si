require 'zip'
class RenderCalendarJob < ApplicationJob
  queue_as :exports
  retry_on StandardError,wait:5.seconds,attempts:3 do |job,error|
    PrintRequest.find(job.arguments.first).update!(status:'failed',error:'Izdelava ni uspela. Poskusite znova.')
  end
  limits_concurrency to:1,key:->(id) { id },duration:15.minutes
  PRINT_INSTRUCTION='Za tisk izberite PDF in merilo 100 % oziroma dejansko velikost. Slike WebP so pripravljene za navedeno velikost papirja pri 600 ppi.'.freeze
  def perform(id)
    request=PrintRequest.find(id);return if request.available?
    request.update!(status:'rendering',started_at:Time.current,attempts:request.attempts+1,error:nil)
    destination=Rails.root.join('storage/exports',request.fingerprint)
    temp=Rails.root.join('tmp',"export-#{request.id}-#{SecureRandom.hex(6)}");FileUtils.mkdir_p(temp)
    options=request.options;identity=PrintCatalog.identity(options);stem=PrintCatalog.filename(options)
    pdf_path=temp.join(stem+'.pdf');result=PdfRenderer.new(options).render(pdf_path.to_s)
    raise 'Preveč strani za en izvoz.' if result[:pages]>120
    paper=PackageImporter.read('print-template-specification')['physical_sizes']['sizes'].find { |p|p['paper']==options['paper'] && p['orientation']==options['orientation'] }
    bin=ENV.fetch('PDFTOPPM_BIN','pdftoppm');page_records=[]
    1.upto(result[:pages]) do |page|
      basename=result[:pages]==1 ? stem : '%s-p%03d' % [stem,page]
      prefix=temp.join(basename)
      command!(bin,'-f',page.to_s,'-l',page.to_s,'-singlefile','-scale-to-x',paper['width_px'].to_s,'-scale-to-y',paper['height_px'].to_s,'-png',pdf_path.to_s,prefix.to_s)
      webp=prefix.to_s+'.webp'
      command!(ENV.fetch('PYTHON_BIN','python3'),Rails.root.join('bin/png-to-webp').to_s,prefix.to_s+'.png',webp,identity['color_mode'])
      page_records << {page_index:page,filename:File.basename(webp),sha256:Digest::SHA256.file(webp).hexdigest,width_px:paper['width_px'],height_px:paper['height_px'],width_mm:paper['width_mm'],height_mm:paper['height_mm'],nominal_ppi:600,color_mode:identity['color_mode']}
      if page==1
        command!(bin,'-f','1','-l','1','-singlefile','-scale-to','600','-png',pdf_path.to_s,temp.join('predogled').to_s)
      end
      File.delete(prefix.to_s+'.png')
    end
    manifest=result.merge(contract_version:'1.1',pair_id:request.fingerprint,identity_fields:identity,
      pdf_filename:pdf_path.basename.to_s,pdf_sha256:Digest::SHA256.file(pdf_path).hexdigest,
      page_count:result[:pages],pages:page_records,
      font_manifest:result.delete(:fonts_used).sort.map { |name| f=Rails.root.join('app/assets/fonts',name);{filename:File.basename(f),sha256:Digest::SHA256.file(f).hexdigest,license:'DejaVu / Bitstream Vera; app/assets/fonts/LICENSE.txt',embedded:true} },
      source_data_version:PrintCatalog.source_version(options),generated_at:Time.current.iso8601,print_instruction_sl:PRINT_INSTRUCTION,
      width_px:paper['width_px'],height_px:paper['height_px'],ppi:600,template_version:PrintCatalog::VERSION,brand:'Koledar365 · koledar365.si')
    temp.join('manifest.json').write(JSON.pretty_generate(manifest))
    temp.join('README.txt').write("Koledar365 · koledar365.si\n\n#{PRINT_INSTRUCTION}\n\n#{result[:pages]} strani. Vse slike so izrisane iz priloženega PDF-ja. Vrstni red: p001, p002 …\nBarvni prostor: sRGB. Pisave v PDF-ju so vdelane.\nKontrolne vsote, velikost papirja in slik: manifest.json.\nOsebni vnosi so vključeni v celotnem seznamu. Znak … v kratkem pregledu napoti na ta seznam.\n")
    if page_records.size>1
      raster=stem+'-multipage-webp-600ppi.zip'
      Zip::File.open(temp.join(raster),create:true) do |zip|
        [*page_records.map { |p|p[:filename] },'manifest.json','README.txt'].each { |file|zip.add(file,temp.join(file)) }
      end
    else
      raster=page_records.first[:filename]
    end
    FileUtils.mkdir_p(destination.dirname);FileUtils.rm_rf(destination) if destination.exist?;FileUtils.mv(temp,destination)
    request.update!(status:'complete',files:{pdf:pdf_path.basename.to_s,webp:raster,preview:'predogled.png',manifest:'manifest.json'},finished_at:Time.current)
  ensure
    FileUtils.rm_rf(temp) if temp && temp.exist?
  end
  def command!(*args) = RenderCommand.run!(*args)
end
