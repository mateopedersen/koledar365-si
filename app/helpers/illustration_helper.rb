require 'digest'
require_relative '../../lib/svg_asset_references'

module IllustrationHelper
  DIRECTION_ICONS = %w[arrow arrow-left arrow-down arrow-up arrow-both chevron-right chevron-left chevron-down external-link trend-up trend-down].freeze
  UI_ICON_NAMES = (%w[
    calendar week clock pin sun moon person search settings plus check note download upload print info
    gift image grid star briefcase calculator cloud shield cookie compass family school holidays personal work
    vacation birthday sunset heart share refresh sprout ics-import ics-export backup-save backup-restore
  ] + DIRECTION_ICONS).freeze
  UI_ICON_SPRITE = '/visuals/ui-material-v3.svg'.freeze
  CALENDAR_FILE_ICONS = {
    'pdf' => '/visuals/download-pdf-v1.svg',
    'webp' => '/visuals/download-webp-v1.svg'
  }.freeze

  LOCAL_TOOL_ART = {
    'dnevi' => 'flag-days',
    'godovi' => 'name-days',
    'studij' => 'study-plan',
    'vpis' => 'admissions',
    'davki' => 'taxes',
    'sezone' => 'seasons',
    'luna' => 'moonrise',
    'pokojnina' => 'retirement'
  }.freeze

  def self.versioned_svg_url(path)
    # The local server serves source files. The static export fingerprints them after rendering.
    return path if Rails.env.development?

    SvgAssetReferences.versioned_url(Rails.root.join('public'), path)
  end

  def development_ui_paint_definitions
    return unless Rails.env.development?

    content_tag(:svg, tag.defs(SvgAssetReferences.ui_sprite_paint_definitions(Rails.root.join('public')).html_safe),
      xmlns: SvgAssetReferences::SVG_NAMESPACE, 'data-k365-ui-paint-defs': '',
      'aria-hidden': 'true', focusable: 'false', width: 0, height: 0,
      style: 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none')
  end

  def page_hero_art(name, css_class: nil)
    image_tag(IllustrationHelper.versioned_svg_url("/visuals/hero-#{name}.svg"),
      alt: '', class: ['page-hero-art', css_class].compact.join(' '), width: 600, height: 380,
      decoding: 'async')
  end

  def ui_icon(name)
    name = name.to_s
    return horoscope_icon if name == 'zodiac'
    name = 'calendar' unless UI_ICON_NAMES.include?(name)
    url = "#{IllustrationHelper.versioned_svg_url(UI_ICON_SPRITE)}##{name}"
    content_tag(:svg, content_tag(:use, nil, href: url, 'xlink:href': url),
      class: ["ui-icon", "icon-#{name}", ("direction-icon" if DIRECTION_ICONS.include?(name))], viewBox: '0 0 64 64', width: 24, height: 24,
      'aria-hidden': 'true', focusable: 'false', 'xmlns:xlink': 'http://www.w3.org/1999/xlink')
  end

  def tool_directory_icon(name)
    reference = "#{IllustrationHelper.versioned_svg_url(UI_ICON_SPRITE)}#tool-art-#{name}"
    content_tag(:svg, content_tag(:use, nil, href: reference, 'xlink:href': reference),
      class: 'tool-directory-icon', viewBox: '0 0 64 64', width: 52, height: 52,
      'aria-hidden': 'true', focusable: 'false', 'xmlns:xlink': 'http://www.w3.org/1999/xlink')
  end

  def navigation_icon(name)
    image_tag(IllustrationHelper.versioned_svg_url("/visuals/navigation/#{name}.svg"),
      alt: '', width: 28, height: 28, class: 'nav-art', 'aria-hidden': 'true')
  end

  def calendar_file_icon(format)
    kind = format.to_s == 'webp' ? 'webp' : 'pdf'
    image_tag(CALENDAR_FILE_ICONS.fetch(kind), width: 26, height: 26,
      class: "calendar-download-action__icon calendar-download-action__icon--#{kind}",
      alt: '', 'aria-hidden': 'true', decoding: 'async')
  end

  def brand_symbol
    image_tag(IllustrationHelper.versioned_svg_url('/visuals/brand-calendar-v3.svg'), width: 52, height: 52,
      alt: '', class: 'brand-mark', 'aria-hidden': 'true')
  end

  def slovenia_flag
    image_tag(IllustrationHelper.versioned_svg_url('/visuals/slovenia-fabric-v3.svg'), width: 36, height: 22,
      alt: '', class: 'country-flag', 'aria-hidden': 'true')
  end

  def horoscope_icon
    image_tag(IllustrationHelper.versioned_svg_url('/horoscope/art/wheel-icon-v1.svg'), width: 24, height: 24,
      alt: '', class: 'ui-icon icon-zodiac', 'aria-hidden': 'true')
  end
end
