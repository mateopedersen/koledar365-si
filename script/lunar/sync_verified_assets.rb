require 'json'
require_relative '../../lib/verified_asset_copy'
root=File.expand_path('../..',__dir__)
manifest=JSON.parse(File.read(File.join(root,'data/lunar/assets.json')))
restored=[]
manifest.fetch('assets').each do |asset|
  %w[pdf webp preview].each do |kind|
    entry=asset.fetch(kind)
    relative=entry.fetch('path')
    raise 'Invalid asset path' if relative.start_with?('/') || relative.split('/').include?('..')
    changed=VerifiedAssetCopy.sync(source:File.join(root,'public',relative),destination:File.join(root,'site',relative),sha256:entry.fetch('sha256'),bytes:entry.fetch('bytes'))
    restored<<relative if changed
  end
end
puts({verified_lunar_assets:manifest.fetch('assets').size*3,restored_copies:restored}.to_json)
