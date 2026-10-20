const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const {DefaultRubyVM}=require(path.join(root,'site/free/vendor/ruby.umd.js'));
(async()=>{
 const binary=fs.readFileSync(process.argv[2]||path.resolve(root,'../../work/free-runtime/koledar365.wasm'));
 const {vm}=await DefaultRubyVM(await WebAssembly.compile(binary));vm.eval('require "/app/boot"');
 function call(route,data){const result=JSON.parse(vm.eval(`PortableApplication.json(Base64.strict_decode64("${Buffer.from(route).toString('base64')}"),Base64.strict_decode64("${Buffer.from(JSON.stringify(data)).toString('base64')}"))`).toString());return result}
 const records=[];
 for(const type of ['workdays','annual','monthly','weekly','lunar','blank','shift','daily','family','school','birthday','name','holidays'])for(const family of ['min','ele','nat','pla','geo'])for(let variant=1;variant<=3;variant++){
  const options={type,year:2028,month:2,date:'2028-02-29',design:family+'-0'+variant,name:type==='name'?'Žan Črt Špela':''};const response=call('/izvozi/',{options});assert.equal(response.ok,true,JSON.stringify(response));const result=response.result;assert.equal(Buffer.from(result.pdf,'base64').subarray(0,5).toString(),'%PDF-');assert.equal(result.proof.layout,options.design);assert.ok(result.proof.pages>0);assert.ok(result.proof.fonts_used.includes('DejaVuSans.ttf'));if(['annual','name'].includes(type))assert.equal(new Set(result.proof.primary_dates).size,366);records.push({type,design:options.design,pages:result.proof.pages,passed:true});vm.eval('GC.start');
 }
 assert.equal(call('/izracun/',{tool:'workdays',from:'2027-01-01',to:'2027-12-31',weekdays:['1','2','3','4','5'],hours:'8',exclude_holidays:'1',include_start:'1',include_end:'1'}).result.result.includes('255'),true);
 for(const options of [{type:'lunar',lunar_scope:'year',year:2028},{type:'workdays',workday_scope:'month',year:2028,month:2}])for(const family of ['min','ele','nat','pla','geo'])for(let variant=1;variant<=3;variant++){const value={...options,design:family+'-0'+variant},r=call('/izvozi/',{options:value});assert.equal(r.ok,true,JSON.stringify(r));if(value.type==='lunar')assert.equal(new Set(r.result.proof.primary_dates).size,366);records.push({type:value.type,scope:value.lunar_scope||value.workday_scope,design:value.design,pages:r.result.proof.pages,passed:true});vm.eval('GC.start')}
 assert.equal(call('/izvozi/',{options:{type:'name',year:2027,name:"#{raise 'code executed'}"}}).ok,true);
 const calendar=call('/ics/izvoz/',{events:[{title:'Špela – sestanek',date:'2028-02-29',time:'09:00',minutes:'60'}]});assert.equal(calendar.ok,true);assert.match(Buffer.from(calendar.result.binary,'base64').toString(),/DTSTART.*20280229T080000Z/);
 const imported=call('/ics/uvoz/',{ics:Buffer.from(calendar.result.binary,'base64').toString()});assert.equal(imported.result.events[0].date,'2028-02-29');assert.equal(imported.result.events[0].time,'09:00');
 assert.equal(call('/izracun/',{tool:'countdown',date:'2027-03-28',time:'02:30',zone:'Europe/Ljubljana'}).ok,false);
 assert.equal(call('/izvozi/',{options:{year:['wrong']}}).ok,false);
 fs.writeFileSync(path.join(root,'evidence/portable-engine.json'),JSON.stringify({checked_at:new Date().toISOString(),engine:'Ruby 4.0.0 WASI official 2.10.1 / same renderer 2.0.1',passed:true,pairs:records.length,tests:['225 actual Prawn PDF outputs','366 leap-year dates','255 workdays','TZID UTC ICS round trip','DST invalid clock refusal','malformed number refusal'],records},null,2));console.log('Portable Ruby: 225 PDF layouts, tools and ICS passed');
})().catch(error=>{console.error(error);process.exit(1)});
