# Extract only actual payment dates from downloaded, reviewed Slovenian sources.
# Usage: bundle exec ruby script/payments/import_verified_sources.rb ZPIZ_HTML CSD_HTML
# This is an editorial import, never a silent network updater or date extrapolator.
require 'nokogiri'
require 'json'
require 'date'
require 'digest'
require 'fileutils'

root=File.expand_path('../..',__dir__)
zpiz_file,csd_file=ARGV
abort 'Provide the reviewed ZPIZ and CSD HTML files.' unless zpiz_file && csd_file
verified='2026-10-21'
sources={
  'zpiz'=>{'title'=>'ZPIZ – Izplačilni dnevi','url'=>'https://www.zpiz.si/cms/content2019/izplailni-dnevi','checked_on'=>verified,'sha256'=>Digest::SHA256.file(zpiz_file).hexdigest},
  'csd'=>{'title'=>'CSD Savinjsko-Šaleška – Terminski plan izplačil javnih transferjev za leto 2026','url'=>'https://www.csd-slovenije.si/csd-savinjsko-saleska/obvestila/terminski-plan-izplacil-javnih-transferjev-za-leto-2026/','checked_on'=>verified,'sha256'=>Digest::SHA256.file(csd_file).hexdigest}
}
weekdays={'pon'=>1,'tor'=>2,'sre'=>3,'čet'=>4,'pet'=>5,'sob'=>6,'ned'=>7}
zpiz=Nokogiri::HTML(File.read(zpiz_file))
pensions=zpiz.css('li').filter_map do |li|
  match=li.text.match(/za mesec\s+(\p{L}+):\s*(\p{L}+),\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(2026)/u)
  next unless match
  date=Date.new(match[5].to_i,match[4].to_i,match[3].to_i)
  raise 'ZPIZ weekday does not match the date.' unless weekdays.fetch(match[2][0,3])==date.cwday
  {'id'=>"pokojnina-#{date.strftime('%Y-%m')}",'category'=>'pokojnine','date'=>date.iso8601,'plan_month'=>date.strftime('%Y-%m'),'source_id'=>'zpiz'}
end
raise 'ZPIZ must contain exactly the 12 official 2026 payments.' unless pensions.size==12 && pensions.map{|r|r['plan_month']}.uniq.size==12
raise 'December is an explicit published exception.' unless pensions.last['date']=='2026-12-29'

definitions=[
  [/\Adržavne štipendije/,'stipendije','Državne in Zoisove štipendije'],
  [/\Apomoč ob rojstvu/,'starsevski-dodatek','Starševski dodatek, pomoč ob rojstvu in rejnine'],
  [/\Aotroški dodatek/,'otroski-dodatek','Otroški dodatek'],
  [/\Adodatek za veliko družino/,'druzinski-dodatki','Dodatek za veliko družino in nego otroka'],
  [/\Aprisp\. zaradi/,'starsevska-nadomestila','Starševska nadomestila in povezani prejemki'],
  [/\Adelno plačilo.*oskrbovalca/i,'oskrbovalec','Oskrbovalec družinskega člana'],
  [/\Adelno plačilo.*pomočnika/i,'druzinski-pomocnik','Družinski pomočnik – poračun'],
  [/\Akomunikacijski/,'komunikacijski-dodatek','Komunikacijski dodatek'],
  [/\ATrajna denarna/i,'zdravstveni-prispevek','Obvezni zdravstveni prispevek pri trajni DSP'],
  [/\Adenarna socialna pomoč I\./,'socialna-pomoc-1','Denarna socialna pomoč – I. obdelava'],
  [/\Avarstveni dodatek/,'varstveni-dodatek','Varstveni dodatek'],
  [/\Adenarna socialna pomoč II\./,'socialna-pomoc-2','Denarna socialna pomoč – II. obdelava'],
  [/\Avinjete/,'vinjete','Vinjete za družine in invalide'],
  [/\Aizvozne/,'izvozne-dajatve','Izvozne dajatve']
]
doc=Nokogiri::HTML(File.read(csd_file))
tables=doc.css('table').select { |table| head=table.css('tr').first;head.css('th,td').size==3 && head.text.include?('vrsta prejemka') }
raise 'CSD must contain 12 monthly source tables.' unless tables.size==12
categories={'pokojnine'=>{'label'=>'Pokojnine','source_label'=>'Pokojnine','source_id'=>'zpiz'}}
transfers=tables.each_with_index.flat_map do |table,index|
  table.css('tr').drop(1).map do |row|
    cells=row.css('td,th').map { |cell|cell.text.gsub(/\s+/,' ').strip }
    raise 'Unexpected source column layout.' unless cells.size==3
    # Column 1 is the internal CSD input cutoff. Column 2 alone is the payment.
    label,_internal_cutoff,payment=cells
    definition=definitions.find { |pattern,_,_|label.match?(pattern) }
    raise "Unreviewed benefit category: #{label}" unless definition
    _,id,short_label=definition
    categories[id]={'label'=>short_label,'source_label'=>label,'source_id'=>'csd'}
    match=payment.match(/(pon|tor|sre|čet|pet|sob|ned)\.?\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/u)
    raise "Unparsed payment: #{payment}" unless match
    date=Date.new(match[4] ? match[4].to_i : 2026,match[3].to_i,match[2].to_i)
    raise "CSD weekday mismatch: #{payment}" unless weekdays.fetch(match[1])==date.cwday
    {'id'=>"#{id}-2026-#{format('%02d',index+1)}",'category'=>id,'date'=>date.iso8601,'plan_month'=>format('2026-%02d',index+1),'source_id'=>'csd'}
  end
end
raise 'Duplicate source payments.' unless transfers.map{|r|r['id']}.uniq.size==transfers.size
record={'version'=>1,'checked_on'=>verified,'plan_year'=>2026,'sources'=>sources,'categories'=>categories,'events'=>(pensions+transfers).sort_by{|r|[r['date'],r['category']]}}
out=File.join(root,'public/payments/data.json');FileUtils.mkdir_p(File.dirname(out));File.write(out,JSON.pretty_generate(record)+"\n")
puts JSON.generate({payments:record['events'].size,pensions:pensions.size,transfers:transfers.size,categories:categories.size,latest:record['events'].last['date']})
