require 'digest'
require 'json'
require 'nokogiri'
require 'time'

# lastmod describes an observed content revision, never the time of a routine build.
# Unknown historical modification dates are omitted instead of invented.
module PublicationRevisions
  module_function
  def fingerprint(html, ignore_countdown_ticks: true)
    doc=Nokogiri::HTML(html)
    content=doc.at_css('main')&.dup
    content&.css('script,style')&.remove
    # The absolute event date remains in data-countdown. Only its clock-driven
    # display changes on routine builds; it is not a significant content edit.
    if ignore_countdown_ticks
      content&.css('strong[data-countdown]')&.each do |node|
        target=node['data-countdown'].to_s
        next unless node.element_children.empty? && target.match?(/\A\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\z/)
        begin
          Time.iso8601(target)
          node.content=''
        rescue ArgumentError
          # Other countdown components and invalid targets remain content.
        end
      end
    end
    Digest::SHA256.hexdigest(JSON.generate([
      doc.at_css('html')&.[]('lang'),doc.at_css('title')&.text,
      doc.at_css('meta[name=description]')&.[]('content'),content&.to_html
    ]))
  end

  def revision(html:, previous_html:, previous_record:, now:)
    digest=fingerprint(html)
    if previous_record && previous_record['sha256']==digest
      previous_record
    elsif previous_html && previous_record &&
        previous_record['sha256']==fingerprint(previous_html,ignore_countdown_ticks:false) &&
        fingerprint(previous_html)==digest
      # A legacy date may have been caused by the ticking clock. Its provenance
      # is unknown, so omit it rather than invent or preserve an unsupported date.
      {'sha256'=>digest}
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
