module IllustrationHelper
  # Purpose-drawn navigation icons: one optical grid and one consistent stroke.
  VECTOR_ART = {
    'calendar' => '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M7 2v5m10-5v5M3 10h18"/><path d="M7 14h2m3 0h2M7 18h2m3 0h2"/><rect x="16" y="16" width="3" height="3" rx=".5" fill="#cd3044" stroke="none"/>',
    'pin' => '<path d="M19 9c0 5.5-7 12-7 12S5 14.5 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.5"/>',
    'clock' => '<circle cx="12" cy="12" r="9.5"/><path d="M12 6v6l4 2M12 2.5v1m9 8.5h-1M12 21.5v-1M2.5 12h1"/>',
    'sun' => '<circle cx="12" cy="12" r="4" fill="#f8e8bd" stroke="#ac7715"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" stroke="#ac7715"/>',
    'moon' => '<path d="M19.8 15.4A9 9 0 0 1 8.6 4.2a9 9 0 1 0 11.2 11.2Z" fill="#edf1f6"/><path d="m18 3 .6 2.4L21 6l-2.4.6L18 9l-.6-2.4L15 6l2.4-.6Z" fill="#768ba5" stroke="none"/>',
    'person' => '<circle cx="12" cy="7" r="3.5"/><path d="M4 21v-2a8 8 0 0 1 16 0v2M4 21h16"/>',
    'search' => '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    'settings' => '<path d="M3 6h5m4 0h9M3 12h11m4 0h3M3 18h4m4 0h10"/><circle cx="10" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="18" r="2"/>',
    'plus' => '<path d="M12 5v14M5 12h14"/>',
    'check' => '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m7 11 4 4 7-8"/>',
    'note' => '<path d="M5 2.5h10L20 8v13.5H5Z"/><path d="M15 2.5V8h5M8 12h9m-9 4h7"/>',
    'download' => '<path d="M12 2v13m-4-4 4 4 4-4M3 16v5h18v-5"/>',
    'upload' => '<path d="M12 16V3m-4 4 4-4 4 4M3 16v5h18v-5"/>',
    'print' => '<path d="M7 8V2h10v6M7 17H3V8h18v9h-4M7 13h10v9H7Z"/><path d="M17 10.5h.5M10 17h4M10 19h4"/>',
    'info' => '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7" r=".9" fill="currentColor" stroke="none"/>',
    'chevron-right' => '<path d="m9 5 7 7-7 7"/>',
    'gift' => '<path d="M3 8h18v5H3ZM5 13v8h14v-8M12 8v13"/><path d="M12 8C4 9 4 1 8 3l4 5Zm0 0c8 1 8-7 4-5l-4 5Z"/>',
    'image' => '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 18 6-6 4 4 3-3 5 5"/>',
    'grid' => '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/>',
    'star' => '<path d="m12 2 3.1 6.4 7 .9-5 4.9 1.2 6.9-6.3-3.3-6.3 3.3 1.2-6.9-5-4.9 7-.9Z"/>',
    'briefcase' => '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12q9 6 18 0M10 14h4"/>',
    'calculator' => '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1"/>',
    'cloud' => '<path d="M6 19a5 5 0 0 1-1-9 7 7 0 0 1 13-2 5.5 5.5 0 0 1 0 11H6Z" fill="#eff3f7"/>',
    'shield' => '<path d="m12 2 8 3v7c0 5-5 8-8 10-3-2-8-5-8-10V5Z"/><path d="m8 11 3 3 5-6"/>',
    'cookie' => '<path d="M20 11a5 5 0 0 1-6-6 5 5 0 0 1-4-3 10 10 0 1 0 12 12 4 4 0 0 1-2-3Z" fill="#faf5eb" stroke="#9c7b48"/><g fill="#9c7b48" stroke="none"><circle cx="8" cy="9" r="1.2"/><circle cx="7" cy="16" r="1.2"/><circle cx="15" cy="16" r="1.2"/><circle cx="20" cy="4" r="1"/></g>',
    'compass' => '<circle cx="12" cy="12" r="9.5"/><path d="m16.5 7.5-2.5 7-6.5 2 2-6.5Z"/><circle cx="12" cy="12" r=".6" fill="currentColor" stroke="none"/>'
  }.freeze

  def ui_icon(name)
    content_tag(:svg, VECTOR_ART.fetch(name, VECTOR_ART.fetch('calendar')).html_safe,
      class: "ui-icon icon-#{name}", viewBox: '0 0 24 24', width: 22, height: 22,
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.65',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round',
      'aria-hidden': 'true', focusable: 'false')
  end
end
