const root=document.querySelector('[data-calendar-directory]');
if(root){
  const buttons=[...root.querySelectorAll('[data-directory-year]')];
  const years=buttons.map(b=>Number(b.dataset.directoryYear)).filter(Boolean);
  const month=root.querySelector('[data-directory-month]');
  const fallbackYear=matchMedia('(max-width:600px)').matches?years[0]:0;
  let year=fallbackYear;
  function readSelection(){
    const query=new URL(location.href).searchParams;
    year=query.get('leto')==='vsa'?0:(years.includes(Number(query.get('leto')))?Number(query.get('leto')):fallbackYear);
    const value=Number(query.get('mesec'));month.value=value>=1&&value<=12?String(value):'0';
  }
  function render(updateUrl=false){
    const selected=Number(month.value),count=year?1:years.length;
    for(const button of buttons)button.setAttribute('aria-pressed',String(Number(button.dataset.directoryYear)===year));
    for(const cell of root.querySelectorAll('[data-directory-column]'))cell.hidden=Boolean(year&&Number(cell.dataset.directoryColumn)!==year);
    for(const row of root.querySelectorAll('[data-directory-row]'))row.hidden=Boolean(selected&&Number(row.dataset.directoryRow)!==selected);
    root.dataset.singleYear=String(Boolean(year));
    root.querySelector('[data-directory-status]').textContent=selected
      ?`${month.selectedOptions[0].textContent}${year?' '+year:''}: ${count} ${count===1?'mesečni koledar':'mesečni koledarji'}.`
      :year?`Leto ${year}: letni koledar in 12 mesečnih koledarjev.`:`Prikazani so ${years.length} letni koledarji in ${years.length*12} mesečnih koledarjev.`;
    root.querySelector('[data-directory-reset]').disabled=year===fallbackYear&&!selected;
    if(updateUrl){const url=new URL(location.href);url.searchParams.set('leto',year||'vsa');if(selected)url.searchParams.set('mesec',selected);else url.searchParams.delete('mesec');history.replaceState(null,'',url);}
  }
  for(const button of buttons)button.addEventListener('click',()=>{year=Number(button.dataset.directoryYear);render(true);});
  month.addEventListener('change',()=>render(true));
  const region=root.querySelector('.cd-table-wrap');
  region.addEventListener('keydown',event=>{
    if(event.target!==region||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')region.scrollLeft=0;
    else if(event.key==='End')region.scrollLeft=region.scrollWidth;
    else region.scrollLeft+=event.key==='ArrowRight'?160:-160;
  });
  root.querySelector('[data-directory-reset]').addEventListener('click',()=>{year=fallbackYear;month.value='0';render(true);});
  window.addEventListener('popstate',()=>{readSelection();render();});
  readSelection();render();root.querySelector('[data-directory-filters]').hidden=false;
}
