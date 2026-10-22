require 'test_helper'
require 'tmpdir'
require_relative '../../lib/verified_asset_copy'

class VerifiedAssetCopyTest < ActiveSupport::TestCase
  test 'restores truncated and same-size corrupted copies without changing the approved source' do
    Dir.mktmpdir do |dir|
      source=File.join(dir,'source.pdf');destination=File.join(dir,'build','output.pdf')
      data="%PDF-1.7\n".b+(0..255).to_a.pack('C*')*100
      File.binwrite(source,data)
      options={source:source,destination:destination,sha256:Digest::SHA256.hexdigest(data),bytes:data.bytesize}
      assert VerifiedAssetCopy.sync(**options)
      assert_equal data,File.binread(destination)
      File.binwrite(destination,data.byteslice(0,10))
      assert VerifiedAssetCopy.sync(**options)
      damaged=data.dup;damaged[1000,500]="\0"*500;File.binwrite(destination,damaged)
      assert VerifiedAssetCopy.sync(**options)
      assert_equal data,File.binread(destination)
      assert_equal data,File.binread(source)
      previous=File.mtime(destination)
      assert_not VerifiedAssetCopy.sync(**options)
      assert_equal previous,File.mtime(destination)
      File.binwrite(source,'not the verified original')
      assert_raises(RuntimeError) { VerifiedAssetCopy.sync(**options) }
      assert_equal data,File.binread(destination)
    end
  end
end
