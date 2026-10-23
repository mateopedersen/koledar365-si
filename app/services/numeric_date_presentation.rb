require 'date'
require 'nokogiri'

# Compact numeric dates are an interface style. Stored dates, downloads,
# scripts, editable text and dates with a written month are left intact.
module NumericDatePresentation
  PATTERN = /(?<![\d.])(\d{1,2})\.[\t \u00a0\u202f]*(\d{1,2})\.(?:[\t \u00a0\u202f]*(\d{4})(?!\d))?(?!\d|\.\d|[\t \u00a0\u202f]*\d)/
  EXCLUDED = %w[script style pre code textarea input noscript].freeze

  def self.compact(value)
    value.gsub(PATTERN) do |original|
      day, month, year = Regexp.last_match.captures
      Date.valid_date?((year || '2000').to_i, month.to_i, day.to_i) ? "#{day}.#{month}.#{year}" : original
    end
  end

  def self.html(value)
    return value unless value.match?(/\d\.(?:[\t \u00a0\u202f]|&(?:nbsp|#160|#8239|#x[aA]0);)+\d/)

    document = Nokogiri::HTML.parse(value, nil, 'UTF-8')
    document.xpath('//text()').each do |node|
      next if node.ancestors.any? { |parent| EXCLUDED.include?(parent.name) || parent['contenteditable'] }
      replacement = compact(node.content)
      node.content = replacement if replacement != node.content
    end
    document.css('[aria-label], [title], img[alt]').each do |node|
      %w[aria-label title alt].each do |attribute|
        next unless node[attribute]
        node[attribute] = compact(node[attribute])
      end
    end
    document.to_html
  end
end
