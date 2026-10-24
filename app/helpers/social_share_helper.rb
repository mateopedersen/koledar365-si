module SocialShareHelper
  def social_share_links(url:, title:, image:)
    message = "#{title} — #{url}"
    links = [
      ['WhatsApp', 'whatsapp', 'W', "https://wa.me/?text=#{ERB::Util.url_encode(message)}"],
      ['Telegram', 'telegram', 'T', "https://t.me/share/url?url=#{ERB::Util.url_encode(url)}&text=#{ERB::Util.url_encode(title)}"],
      ['Facebook', 'facebook', 'f', "https://www.facebook.com/sharer/sharer.php?u=#{ERB::Util.url_encode(url)}"],
      ['X', 'x', 'X', "https://x.com/intent/tweet?url=#{ERB::Util.url_encode(url)}&text=#{ERB::Util.url_encode(title)}"],
      ['Bluesky', 'bluesky', 'B', "https://bsky.app/intent/compose?text=#{ERB::Util.url_encode("#{title.truncate(120)} #{url}")}"],
      ['LinkedIn', 'linkedin', 'in', "https://www.linkedin.com/sharing/share-offsite/?url=#{ERB::Util.url_encode(url)}"],
      ['Pinterest', 'pinterest', 'P', "https://www.pinterest.com/pin/create/button/?url=#{ERB::Util.url_encode(url)}&media=#{ERB::Util.url_encode(image)}&description=#{ERB::Util.url_encode(title)}"]
    ]
    links.map { |label, key, mark, href| {label: label, key: key, mark: mark, href: href} }
  end
end
