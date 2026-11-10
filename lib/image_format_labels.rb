# frozen_string_literal: true
# Translate presentation labels; MIME types, extensions and media URLs stay intact.
module ImageFormatLabels
  REPLACEMENTS = [["Prenesi WebP", "Prenesi sliko"], ["PDF in WebP", "PDF in slike"], ["PDF ali WebP", "PDF ali sliko"], ["Slike WebP", "Slike"], ["strani WebP", "slikovnih strani"], ["WebP pa", "slika pa"], ["JPEG, PNG ali WebP", "Slikovna datoteka"], ["JPEG, PNG, WebP", "Slikovne datoteke"]].freeze
  def self.localize(text)
    REPLACEMENTS.each { |source, label| text = text.gsub(source, label) }
    text.gsub(/\bWebP\b/, "Slika").gsub("in Slika za hiter", "in sliko za hiter").gsub("in Slika celotne strani", "in slika celotne strani").gsub("slikami Slika", "slikami").gsub("sliko Slika", "sliko").gsub("ali Slika za uporabo kot sliko", "ali sliko za digitalno uporabo").gsub("ujemajoči se Slika", "ujemajočo se sliko").gsub("Večstranski Slika je", "Večstranski slikovni izvoz je").gsub("v AVIF oziroma Slika", "v spletne slikovne formate").gsub("v Slika", "v slikovni format").gsub("JPG, PNG, Slika", "Slikovne datoteke")
  end
  def self.rewrite!(directory)
    Dir.glob(File.join(directory, "**/*.html")).each do |path|
      source = File.read(path)
      localized = localize(source)
      File.write(path, localized) unless localized == source
    end
  end
end
