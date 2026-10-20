class PrivatePhoto
  MAX_BYTES=20.megabytes
  ROOT=Rails.root.join('storage/private_photos')
  def self.save!(upload,owner)
    raise ArgumentError,'Izberite fotografijo JPEG, PNG ali WebP do 20 MB.' unless upload.respond_to?(:tempfile) && upload.size.between?(1,MAX_BYTES)
    id=SecureRandom.hex(24);dir=ROOT.join(id);FileUtils.mkdir_p(dir)
    RenderCommand.run!(ENV.fetch('PYTHON_BIN','python3'),Rails.root.join('bin/prepare-photo').to_s,upload.tempfile.path,dir.to_s,timeout:30)
    metadata=JSON.parse(dir.join('image.json').read).merge('owner'=>Digest::SHA256.hexdigest(owner),'expires_at'=>7.days.from_now.iso8601)
    dir.join('image.json').write(JSON.generate(metadata))
    {token:Rails.application.message_verifier('photo').generate(id,expires_in:7.days,purpose:'calendar-photo'),width:metadata['width'],height:metadata['height']}
  rescue StandardError
    FileUtils.rm_rf(dir) if dir
    raise ArgumentError,'Fotografije ni mogoče uporabiti. Izberite JPEG, PNG ali WebP z najmanj 900 × 600 in največ 40 milijoni slikovnih pik.'
  end
  def self.resolve!(token,owner)
    id=Rails.application.message_verifier('photo').verified(token,purpose:'calendar-photo')
    raise ArgumentError,'Fotografija je potekla. Naložite jo znova.' unless id.to_s.match?(/\A[0-9a-f]{48}\z/)
    file=ROOT.join(id,'image.json');raise ArgumentError,'Fotografija ni na voljo.' unless file.file?
    data=JSON.parse(file.read)
    raise ArgumentError,'Fotografija ne pripada tej seji.' unless ActiveSupport::SecurityUtils.secure_compare(data['owner'],Digest::SHA256.hexdigest(owner.to_s))
    raise ArgumentError,'Fotografija je potekla.' unless Time.iso8601(data['expires_at'])>Time.current
    {'id'=>id,'sha256'=>data['sha256'],'width'=>data['width'],'height'=>data['height']}
  end
  def self.path(photo,bw:false)
    id=photo.fetch('id');raise ArgumentError,'Neveljavna fotografija.' unless id.match?(/\A[0-9a-f]{48}\z/)
    ROOT.join(id,bw ? 'gray.png':'photo.png')
  end
  def self.expire!
    return unless ROOT.directory?
    ROOT.children.select(&:directory?).each do |dir|
      file=dir.join('image.json')
      expired=file.file? ? Time.iso8601(JSON.parse(file.read)['expires_at'])<Time.current : dir.mtime<1.hour.ago
      FileUtils.rm_rf(dir) if expired
    end
  end
end
