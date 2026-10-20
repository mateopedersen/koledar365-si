module LunarHelper
  def lunar_moon(date,small:false,detail:false)
    index=date[-2..].to_i-1
    size=small ? 96 : 768; columns=small ? 7 : 6; local=index
    file="/lunar/atlas/#{date[0,7]}-#{small ? 'small' : 1}.webp"
    content_tag(:svg,viewBox:"#{local%columns*size} #{local/columns*size} #{size} #{size}",class:'lunar-moon',role:small ? nil : 'img','aria-hidden':small ? 'true' : nil,'aria-label':small ? nil : "Luna #{LunarCalendar.date_label(date)} ob 12.00",data:detail ? {detail_image:true} : {}) do
      tag(:image,href:file,width:columns*size,height:(small ? 5 : 6)*size)
    end
  end
  def lunar_day(day,small:false)
    label="#{LunarCalendar.date_label(day['date'])}, osvetljenost #{LunarCalendar.percent(day)}, #{day['phaseNameSl']}"
    content_tag(:button,type:'button',class:'lunar-day',data:{date:day['date']},'aria-label':label,'aria-pressed':'false') do
      safe_join([content_tag(:span,day['date'][-2..].to_i,class:'lunar-number'),lunar_moon(day['date'],small:true),content_tag(:span,LunarCalendar.percent(day),class:'lunar-percent'),(day['eventIds'].any? ? content_tag(:span,'◆',class:'lunar-event-dot','aria-label':'Glavna lunina mena') : nil)].compact)
    end
  end
end
