module IllustrationHelper
  UI_ICON_NAMES = %w[calendar week clock pin sun moon person search settings plus check note download upload print info chevron-right gift image grid star briefcase calculator cloud shield cookie compass family school holidays personal work vacation birthday sunset heart arrow refresh].freeze
  UI_ICON_SPRITE = '/visuals/ui-material-v3.svg'.freeze

  def ui_icon(name)
    name = name.to_s
    name = 'calendar' unless UI_ICON_NAMES.include?(name)
    content_tag(:svg, content_tag(:use, nil, href: "#{UI_ICON_SPRITE}##{name}"),
      class: "ui-icon icon-#{name}", viewBox: '0 0 64 64', width: 24, height: 24,
      'aria-hidden': 'true', focusable: 'false')
  end

  def brand_symbol
    image_tag('/visuals/brand-calendar-v3.svg', width: 44, height: 44,
      alt: '', class: 'brand-mark', 'aria-hidden': 'true')
  end

  def slovenia_flag
    image_tag('/visuals/slovenia-fabric-v3.svg', width: 36, height: 22,
      alt: '', class: 'country-flag', 'aria-hidden': 'true')
  end
end
