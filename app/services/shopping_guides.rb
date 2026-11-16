class ShoppingGuides
  DATA=JSON.parse(Rails.root.join('data/shopping-guides.json').read).freeze
  CHECKED=DATA.fetch('checked')
  def self.pages
    DATA.fetch('paths').each_with_index.to_h{|path,i|p=DATA.fetch('pages')[i];[path,{title:p.fetch('title'),description:p.fetch('description'),family:'shopping'}]}
  end
  def self.page(path) = pages[path]
  def self.body(path)
    index=DATA.fetch('paths').index(path)
    raise ArgumentError,'Unknown shopping guide' unless index
    Rails.root.join('data/shopping-html',DATA.fetch('pages')[index].fetch('slug')+'.html').read
  end
  def self.discovery = Rails.root.join('data/shopping-html/discovery.html').read
  def self.image(path)
    index=DATA.fetch('paths').index(path);return unless index
    p=DATA.fetch('pages')[index]
    {'path'=>'/shopping/'+p.fetch('slug')+'-og.png','width'=>1200,'height'=>630,'alt'=>p.fetch('name')+' 2026: izdelek in dostava','credit'=>'Koledar365'}
  end
end
