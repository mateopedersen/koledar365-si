require 'digest'
require 'fileutils'
require 'tempfile'

# Keep immutable, previously approved print assets byte-identical during export.
# A source mismatch is fatal; only a faulty destination copy may be restored.
module VerifiedAssetCopy
  module_function

  def sync(source:, destination:, sha256:, bytes:)
    original=File.binread(source)
    raise "Unverified source asset: #{source}" unless original.bytesize==bytes && Digest::SHA256.hexdigest(original)==sha256
    return false if File.file?(destination) && File.size(destination)==bytes && Digest::SHA256.file(destination).hexdigest==sha256

    FileUtils.mkdir_p(File.dirname(destination))
    Tempfile.create(['verified-asset-','.tmp'],File.dirname(destination),binmode:true) do |temporary|
      # Explicit writes avoid the optimized filesystem-copy path that produced
      # zero-filled blocks in two otherwise correctly sized PDF copies.
      temporary.write(original)
      temporary.flush
      temporary.fsync
      raise "Asset copy verification failed: #{destination}" unless Digest::SHA256.file(temporary.path).hexdigest==sha256
      File.chmod(0644,temporary.path)
      File.rename(temporary.path,destination)
    end
    true
  end
end
