module SocialShareHelper
  def social_share_links(url:, title:, image:)
    message = "#{title} — #{url}"
    links = [
      ['WhatsApp', 'whatsapp', "https://wa.me/?text=#{ERB::Util.url_encode(message)}"],
      ['Telegram', 'telegram', "https://t.me/share/url?url=#{ERB::Util.url_encode(url)}&text=#{ERB::Util.url_encode(title)}"],
      ['Facebook', 'facebook', "https://www.facebook.com/sharer/sharer.php?u=#{ERB::Util.url_encode(url)}"],
      ['X', 'x', "https://x.com/intent/tweet?url=#{ERB::Util.url_encode(url)}&text=#{ERB::Util.url_encode(title)}"],
      ['Bluesky', 'bluesky', "https://bsky.app/intent/compose?text=#{ERB::Util.url_encode("#{title.truncate(120)} #{url}")}"],
      ['LinkedIn', 'linkedin', "https://www.linkedin.com/sharing/share-offsite/?url=#{ERB::Util.url_encode(url)}"],
      ['Pinterest', 'pinterest', "https://www.pinterest.com/pin/create/button/?url=#{ERB::Util.url_encode(url)}&media=#{ERB::Util.url_encode(image)}&description=#{ERB::Util.url_encode(title)}"]
    ]
    links.map do |label, key, href|
      extension = %w[facebook x linkedin pinterest].include?(key) ? 'png' : 'svg'
      {label: label, key: key, href: href, icon: "/social/#{key}.#{extension}"}
    end
  end
end
