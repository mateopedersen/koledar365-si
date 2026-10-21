// Small, dependency-free OOXML writer. Every date remains a numeric Excel date;
// notes are editable cells and user text is always an inline string, never a formula.
const encoder=new TextEncoder();
const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const declaration='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const spreadsheetNS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const relationshipNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const pad=value=>String(value).padStart(2,'0');
const iso=date=>date.toISOString().slice(0,10);
export const excelDate=date=>Math.round((date-Date.UTC(1899,11,30))/86400000);
export function isoWeek(date){const thursday=new Date(date);thursday.setUTCDate(thursday.getUTCDate()+4-(thursday.getUTCDay()||7));const year=thursday.getUTCFullYear();return {year,week:Math.ceil(((thursday-Date.UTC(year,0,1))/86400000+1)/7)}}
function stringCell(ref,value,style=0){return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`}
function numberCell(ref,value,style=0,formula=''){return `<c r="${ref}" s="${style}">${formula?`<f>${xml(formula)}</f>`:''}<v>${value}</v></c>`}
const row=(number,cells,height=22)=>`<row r="${number}" ht="${height}" customHeight="1">${cells.join('')}</row>`;
const sheet=(rows,{widths=[6,18,18,18,18,18,18,18],merges=[],lastRow=rows.length,landscape=true,filter}={})=>declaration+`<worksheet xmlns="${spreadsheetNS}"><dimension ref="A1:${String.fromCharCode(64+widths.length)}${lastRow}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols>${widths.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData>${filter?`<autoFilter ref="${filter}"/>`:''}${merges.length?`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join('')}</mergeCells>`:''}<printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.3" bottom="0.3" header="0.15" footer="0.15"/><pageSetup paperSize="9" orientation="${landscape?'landscape':'portrait'}" fitToWidth="1" fitToHeight="1"/><headerFooter><oddFooter>&amp;LKoledar365 · koledar365.si&amp;R&amp;P / &amp;N</oddFooter></headerFooter></worksheet>`;
function monthSheet(year,month,data,notes){
  const holidays=new Map(data.holidays.map(event=>[event.date,event.title]));
  const title=data.months[month-1][0].toLocaleUpperCase('sl')+data.months[month-1].slice(1)+' '+year;
  const rows=[row(1,[stringCell('A1',title,1)],32),row(2,[stringCell('A2','Slovenija · ponedeljek–nedelja · rdeče so označeni dela prosti dnevi',2)],24),row(3,[],8),row(4,[stringCell('A4','T',3),...data.days.map((day,i)=>stringCell(`${String.fromCharCode(66+i)}4`,day,3))],25)];
  const merges=['A1:H1','A2:H2'];
  const first=new Date(Date.UTC(year,month-1,1));first.setUTCDate(first.getUTCDate()-(first.getUTCDay()||7)+1);
  const last=new Date(Date.UTC(year,month,0));let index=0;
  for(let start=new Date(first);start<=last;start.setUTCDate(start.getUTCDate()+7),index++){
    const r=5+index*3,dates=[numberCell(`A${r}`,isoWeek(start).week,2)],names=[stringCell(`A${r+1}`,'',2)],spaces=[stringCell(`A${r+2}`,'',2)];
    for(let day=0;day<7;day++){
      const date=new Date(start);date.setUTCDate(date.getUTCDate()+day);const column=String.fromCharCode(66+day),current=date.getUTCMonth()===month-1,title=holidays.get(iso(date))||'';
      dates.push(current?numberCell(column+r,excelDate(date),title?5:day>4?6:4):stringCell(column+r,'',9));
      names.push(stringCell(column+(r+1),current?title:'',current?8:9));
      spaces.push(stringCell(column+(r+2),'',current?7:9));
    }
    rows.push(row(r,dates,23),row(r+1,names,30),row(r+2,spaces,34));
    merges.push(`A${r}:A${r+2}`);
  }
  const end=5+index*3;
  rows.push(row(end,[stringCell(`A${end}`,'Mesečni cilji in zapiski',3)],24),row(end+1,[stringCell(`A${end+1}`,notes||'',7)],62),row(end+2,[stringCell(`A${end+2}`,'Prazniki po veljavnem ZPDPD. Preverjeno 21. 10. 2026. Prihodnja leta so odvisna od morebitnih sprememb predpisa.',2)],30));
  merges.push(`A${end}:H${end}`,`A${end+1}:H${end+1}`,`A${end+2}:H${end+2}`);
  return {name:data.months[month-1][0].toLocaleUpperCase('sl')+data.months[month-1].slice(1),xml:sheet(rows,{merges,lastRow:end+2}),printArea:`$A$1:$H$${end+2}`};
}
function datesSheet(year,month,data){
  const holidays=new Map(data.holidays.map(event=>[event.date,event.title]));
  const first=new Date(Date.UTC(year,month?month-1:0,1)),last=new Date(Date.UTC(year,month||12,0));
  const labels=['Datum','Dan v tednu','Teden ISO','Dela prost dan','Praznik','Delovni dan (pon–pet)','Moji zapiski'];
  const rows=[row(1,[stringCell('A1',`Datumi ${year}${month?' / '+pad(month):''}`,1)],32),row(2,[stringCell('A2','Dopolnite stolpec »Moji zapiski«. Delovni dnevi se preračunajo iz datumov in označenih praznikov.',2)],28),row(3,[],8),row(4,labels.map((label,i)=>stringCell(String.fromCharCode(65+i)+'4',label,3)),30)];
  let r=5,count=0;
  for(let date=new Date(first);date<=last;date.setUTCDate(date.getUTCDate()+1),r++){
    const holiday=holidays.get(iso(date))||'',weekday=date.getUTCDay()||7,working=weekday<6&&!holiday?1:0;count+=working;
    rows.push(row(r,[numberCell(`A${r}`,excelDate(date),holiday?11:10),stringCell(`B${r}`,data.days[weekday-1],7),stringCell(`C${r}`,`${isoWeek(date).year} / ${isoWeek(date).week}`,7),stringCell(`D${r}`,holiday?'Da':'Ne',7),stringCell(`E${r}`,holiday,8),numberCell(`F${r}`,working,7,`IF(AND(WEEKDAY(A${r},2)<6,D${r}="Ne"),1,0)`),stringCell(`G${r}`,'',7)],28));
  }
  rows.push(row(r,[stringCell(`A${r}`,'Skupaj delovnih dni',3),numberCell(`F${r}`,count,3,`SUM(F5:F${r-1})`)],26));
  return {name:'Datumi',xml:sheet(rows,{widths:[17,18,14,18,47,24,36],merges:['A1:G1','A2:G2',`A${r}:E${r}`],lastRow:r,filter:`A4:G${r-1}`})};
}
function instructionsSheet(data){const lines=[
  ['Koledar365 · navodila in viri',''],
  ['Urejanje','Datumi so prave datumske celice. Dodajte svoje zapiske pod datumi ali v stolpec »Moji zapiski« na listu Datumi.'],
  ['Tisk','Mesečni listi so pripravljeni za papir A4 ležeče. Pred tiskanjem preverite predogled in po potrebi prilagodite višino vrstic.'],
  ['Delovni dnevi','Privzeto ponedeljek–petek. Odštejemo samo zakonsko dela proste dneve; praznikov ob koncu tedna ne prenesemo na ponedeljek. Formule na listu Datumi se ponovno preračunajo v preglednici.'],
  ['Pravna podlaga',data.source],
  ['Kontrola podatkov','21. 10. 2026. Prihodnja leta sledijo trenutno veljavnemu zakonu in niso zagotovilo, da se predpis ne bo spremenil.'],
  ['Preverjanje 2026','Seznam praznikov in dela prostih dni v Republiki Sloveniji, OPSI, Ministrstvo za javno upravo; CC BY 4.0.'],
  ['Podatkovna zbirka','https://podatki.gov.si/dataset/seznam-praznikov-in-dela-prostih-dni-v-republiki-sloveniji'],
  ['Avtor','Koledar365 · https://koledar365.si/']
];return {name:'Navodila',xml:sheet(lines.map(([label,text],i)=>row(i+1,[stringCell(`A${i+1}`,label,i?3:1),stringCell(`B${i+1}`,text,7)],i?58:34)),{widths:[29,110],lastRow:lines.length,landscape:true})}}
const styles=declaration+`<styleSheet xmlns="${spreadsheetNS}"><numFmts count="2"><numFmt numFmtId="164" formatCode="d"/><numFmt numFmtId="165" formatCode="dd.mm.yyyy"/></numFmts><fonts count="5"><font><sz val="11"/><name val="Arial"/><color rgb="FF172941"/></font><font><b/><sz val="24"/><name val="Arial"/><color rgb="FF0054B8"/></font><font><sz val="9"/><name val="Arial"/><color rgb="FF617083"/></font><font><b/><sz val="11"/><name val="Arial"/><color rgb="FFFFFFFF"/></font><font><b/><sz val="12"/><name val="Arial"/><color rgb="FFB42238"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0054B8"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F5FA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF0F2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD8E0EB"/></left><right style="thin"><color rgb="FFD8E0EB"/></right><top style="thin"><color rgb="FFD8E0EB"/></top><bottom style="thin"><color rgb="FFD8E0EB"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="12">${[
  [0,0,0,0],[0,1,0,0],[0,2,0,0],[0,3,2,1],[164,0,0,1],[164,4,4,1],[164,0,3,1],[0,0,0,1],[0,4,0,1],[0,2,3,1],[165,0,0,1],[165,4,4,1]
].map(([num,font,fill,border])=>`<xf numFmtId="${num}" fontId="${font}" fillId="${fill}" borderId="${border}" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>`).join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles><dxfs count="0"/><tableStyles count="0" defaultTableStyle="TableStyleMedium2" defaultPivotStyle="PivotStyleLight16"/></styleSheet>`;
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
function zip(files){const parts=[],central=[];let offset=0,centralLength=0;for(const [name,text] of files){const filename=encoder.encode(name),body=encoder.encode(text),crc=crc32(body),local=new Uint8Array(30+filename.length),lv=new DataView(local.buffer);lv.setUint32(0,0x04034b50,true);lv.setUint16(4,20,true);lv.setUint16(6,0x800,true);lv.setUint16(12,0x5d55,true);lv.setUint32(14,crc,true);lv.setUint32(18,body.length,true);lv.setUint32(22,body.length,true);lv.setUint16(26,filename.length,true);local.set(filename,30);parts.push(local,body);const entry=new Uint8Array(46+filename.length),cv=new DataView(entry.buffer);cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);cv.setUint16(8,0x800,true);cv.setUint16(14,0x5d55,true);cv.setUint32(16,crc,true);cv.setUint32(20,body.length,true);cv.setUint32(24,body.length,true);cv.setUint16(28,filename.length,true);cv.setUint32(42,offset,true);entry.set(filename,46);central.push(entry);centralLength+=entry.length;offset+=local.length+body.length}const end=new Uint8Array(22),view=new DataView(end.buffer);view.setUint32(0,0x06054b50,true);view.setUint16(8,files.length,true);view.setUint16(10,files.length,true);view.setUint32(12,centralLength,true);view.setUint32(16,offset,true);return new Blob([...parts,...central,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'})}
export function createCalendarWorkbook({year,month=null,data,notes=''}){
  if(!Number.isInteger(year)||!data.years.includes(year)||month!==null&&(!Number.isInteger(month)||month<1||month>12))throw Error('Izberite veljavno leto in mesec.');
  const months=month?[month]:Array.from({length:12},(_,i)=>i+1),sheets=months.map(value=>monthSheet(year,value,data,month?notes:''));sheets.push(datesSheet(year,month,data),instructionsSheet(data));
  const files=[['[Content_Types].xml',declaration+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],['_rels/.rels',declaration+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${relationshipNS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`],['xl/styles.xml',styles],['xl/workbook.xml',declaration+`<workbook xmlns="${spreadsheetNS}" xmlns:r="${relationshipNS}"><workbookPr date1904="0"/><bookViews><workbookView/></bookViews><sheets>${sheets.map((value,i)=>`<sheet name="${xml(value.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><definedNames>${sheets.flatMap((value,i)=>value.printArea?[`<definedName name="_xlnm.Print_Area" localSheetId="${i}">'${xml(value.name)}'!${value.printArea}</definedName>`]:[]).join('')}</definedNames><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`],['xl/_rels/workbook.xml.rels',declaration+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_,i)=>`<Relationship Id="rId${i+1}" Type="${relationshipNS}/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="${relationshipNS}/styles" Target="styles.xml"/></Relationships>`],...sheets.map((value,i)=>[`xl/worksheets/sheet${i+1}.xml`,value.xml])];
  return {blob:zip(files),filename:`koledar365-${month?'mesecni':'letni'}-koledar-${year}${month?'-'+pad(month):''}.xlsx`};
}
