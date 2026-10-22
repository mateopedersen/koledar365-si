require 'digest'
require 'json'
require 'nokogiri'
require 'time'

# lastmod describes an observed content revision, never the time of a routine build.
# Unknown historical modification dates are omitted instead of invented.
module PublicationRevisions
  module_function
  def fingerprint(html)
    doc=Nokogiri::HTML(html)
    content=doc.at_css('main')&.dup
    content&.css('script,style')&.remove
    Digest::SHA256.hexdigest(JSON.generate([
      doc.at_css('html')&.[]('lang'),doc.at_css('title')&.text,
      doc.at_css('meta[name=description]')&.[]('content'),content&.to_html
    ]))
  end

  def revision(html:, previous_html:, previous_record:, now:)
    digest=fingerprint(html)
    if previous_record && previous_record['sha256']==digest
      previous_record
    else
      previous_digest=previous_record&.fetch('sha256',nil) || (fingerprint(previous_html) if previous_html)
      {'sha256'=>digest,'modified_at'=>(now.utc.iso8601 if previous_digest && previous_digest!=digest)}.compact
    end
  end

  def apply_html(html, record)
    return html unless record['modified_at']
    doc=Nokogiri::HTML(html)
    doc.css('script[type="application/ld+json"]').each do |node|
      data=JSON.parse(node.text)
      Array(data['@graph']).select{|item|item['@type']=='WebPage'}.each{|item|item['dateModified']=record['modified_at']}
      node.content=JSON.generate(data).gsub('<','\\u003c')
    end
    doc.to_html
  end

  def apply_sitemap(xml, records)
    doc=Nokogiri::XML(xml)
    doc.xpath('//*[local-name()="url"]').each do |url|
      loc=url.at_xpath('./*[local-name()="loc"]')
      path=loc.text.delete_prefix('https://koledar365.si')
      url.xpath('./*[local-name()="lastmod"]').remove
      next unless records.dig(path,'modified_at')
      lastmod=Nokogiri::XML::Node.new('lastmod',doc);lastmod.namespace=url.namespace
      lastmod.content=records[path]['modified_at'];loc.add_next_sibling(lastmod)
    end
    doc.to_xml
  end
end
