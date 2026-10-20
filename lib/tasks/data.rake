namespace :data do
  desc "Idempotently import the supplied source package"
  task import: :environment do
    puts PackageImporter.run!.to_json
  end
  desc "Publish names in popularity order after font and export gates"
  task :publish_names, [:limit] => :environment do |_,args|
    puts NamePublisher.run!(args[:limit].to_i.nonzero? || 200).to_json
  end
end
