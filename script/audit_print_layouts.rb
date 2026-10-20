require 'tmpdir'
class LayoutAuditRenderer < PdfRenderer
  attr_reader :layout_issues
  def initialize(options)
    super
    @layout_issues=[]
  end
  def text(s,x,y,width,**kwargs)
    if s.present? && (x < -16 || y < 17 && y != 10 || y > @h+16 || width<=0 || kwargs.fetch(:height,30)<=0 || x+width>@w+17)
      @layout_issues << {text:s.to_s.first(70),x:x,y:y,width:width,height:kwargs[:height]}
    end
    super
  end
  def box(x,y,w,h,**kwargs)
    @layout_issues << {box:[x,y,w,h]} if y-h < 17 && x>=0 || w<=0 || h<=0
    super
  end
end
rows=[]
Dir.mktmpdir('layout-audit') do |dir|
  %w[A3 A4 A5].product(%w[portrait landscape],PrintCatalog::TYPES.keys,PrintCatalog.designs.map { |d|d['id'] }).each do |paper,orientation,type,design|
    o=PrintCatalog.normalize(paper:paper,orientation:orientation,type:type,design:design,year:2028,month:2,date:'2028-02-29')
    renderer=LayoutAuditRenderer.new(o)
    begin
      result=renderer.render(File.join(dir,'render.pdf'))
      rows << {paper:paper,orientation:orientation,type:type,design:design,pages:result[:pages],issues:renderer.layout_issues}
    rescue => e
      rows << {paper:paper,orientation:orientation,type:type,design:design,error:e.message,issues:renderer.layout_issues}
    end
  end
end
report={version:PrintCatalog::VERSION,checked_at:Time.current.iso8601,total:rows.size,failures:rows.select { |r|r[:error]||r[:issues].any? }}
Rails.root.join('evidence/print-layout-audit.json').write(JSON.pretty_generate(report))
puts JSON.pretty_generate(report.except(:failures).merge(failed:report[:failures].size,examples:report[:failures].first(4)))
