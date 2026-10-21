'use strict';
(()=>{
 const root=document.querySelector('[data-family-planner]');
 if(!root||!window.K365FamilyPlannerCore)return;
 const core=window.K365FamilyPlannerCore;
 const $=(selector,context=root)=>context.querySelector(selector);
 const $$=(selector,context=root)=>Array.from(context.querySelectorAll(selector));
 const key='k365.family.v1';
 const emptyState=()=>({version:1,members:[],events:[],meals:[],groceries:[]});
 const say=(node,message,error)=>{
  if(!node)return;
  node.textContent=message;
  node.classList.toggle('error',!!error);
 };
 const makeId=()=>crypto.randomUUID?crypto.randomUUID():('fp-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12));
 const make=(tag,className,text)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(text!==undefined)node.textContent=text;
  return node;
 };
 const iconEmpty=()=>{
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 24 24');
  svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');
  path.setAttribute('d','M4 5h16v15H4zM8 3v4m8-4v4M8 11h8m-8 4h5');
  svg.append(path);
  return svg;
 };
 let data=emptyState();
 let loadError='';
 try{
  const raw=localStorage.getItem(key);
  if(raw)data=core.validateState(JSON.parse(raw));
 }catch(error){loadError=error.message||'Shranjeni podatki niso veljavni.'}
 let weekStart=core.mondayISO(core.todayISO());
 const memberStatus=$('[data-family-member-status]');
 const eventStatus=$('[data-family-event-status]');
 const mealStatus=$('[data-family-meal-status]');
 const groceryStatus=$('[data-family-grocery-status]');
 const backupStatus=$('[data-family-backup-status]');
 const eventForm=$('[data-family-event-form]');
 const mealForm=$('[data-family-meal-form]');
 const eventDate=eventForm.elements.namedItem('date');
 const eventTitle=eventForm.elements.namedItem('title');
 const memberForm=$('[data-family-member-form]');
 const mealDate=mealForm.elements.namedItem('date');
 const weekLabel=$('[data-family-week-label]');
 const dayFormatter=new Intl.DateTimeFormat('sl-SI',{weekday:'long',timeZone:'UTC'});
 const shortDayFormatter=new Intl.DateTimeFormat('sl-SI',{weekday:'short',timeZone:'UTC'});
 const dateFormatter=new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const monthFormatter=new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'short',timeZone:'UTC'});
 const today=core.todayISO();
 const dateObject=iso=>core.parseISO(iso);
 const formatDate=(iso,formatter=dateFormatter)=>{
  const date=dateObject(iso);
  if(!date)return iso;
  return formatter.format(date);
 };
 const firstUpper=value=>value?value.charAt(0).toLocaleUpperCase('sl-SI')+value.slice(1):'';
 const initials=name=>name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase('sl-SI');
 const memberById=id=>data.members.find(member=>member.id===id);
 const occurrences=()=>core.expandWeek(data.events,weekStart);
 const weekMeals=()=>data.meals.filter(meal=>meal.date>=weekStart&&meal.date<=core.addDays(weekStart,6)).sort((a,b)=>a.date.localeCompare(b.date));
 const dateDay=iso=>dateObject(iso).getUTCDay();
 function persist(statusNode,message){
  try{
   localStorage.setItem(key,JSON.stringify(data));
   loadError='';
   if(statusNode)say(statusNode,message||'Shranjeno v tem brskalniku.');
   renderAll();
   return true;
  }catch(error){
   if(statusNode)say(statusNode,'Shranjevanje ni uspelo. Prenesite varnostno kopijo in poskusite znova.',true);
   return false;
  }
 }
 function setDateDefaults(){
  eventDate.value=weekStart===core.mondayISO(today)?today:weekStart;
  mealDate.value=eventDate.value;
 }
 function renderWeekHeading(){
  const end=core.addDays(weekStart,6);
  const startDate=dateObject(weekStart),endDate=dateObject(end);
  const startMonth=new Intl.DateTimeFormat('sl-SI',{month:'long',timeZone:'UTC'}).format(startDate);
  const endMonth=new Intl.DateTimeFormat('sl-SI',{month:'long',timeZone:'UTC'}).format(endDate);
  const startYear=startDate.getUTCFullYear(),endYear=endDate.getUTCFullYear();
  let text;
  if(startYear!==endYear)text=firstUpper(formatDate(weekStart,monthFormatter))+' '+startYear+' – '+formatDate(end,monthFormatter)+' '+endYear;
  else if(startDate.getUTCMonth()!==endDate.getUTCMonth())text=firstUpper(formatDate(weekStart,monthFormatter))+' – '+formatDate(end,monthFormatter)+' '+endYear;
  else text=firstUpper(String(startDate.getUTCDate()))+'–'+endDate.getUTCDate()+'. '+endMonth+' '+endYear;
  weekLabel.textContent=text;
  weekLabel.dataset.start=weekStart;
 }
 function emptyBox(title,description){
  const box=make('div','family-empty');
  box.append(iconEmpty(),make('strong','',title),make('p','',description));
  return box;
 }
 function renderMembers(){
  const list=$('[data-family-members]');
  list.replaceChildren();
  if(!data.members.length)list.append(emptyBox('Začnite s svojo družino','Dodajte imena, da jih lahko povežete z dogodki in opravili.'));
  for(const member of data.members){
   const row=make('div','family-member-row');
   row.dataset.familyColor=member.color;
   const identity=make('div','family-member-identity');
   const avatar=make('span','family-avatar',initials(member.name));
   avatar.setAttribute('aria-hidden','true');
   const label=make('div');
   label.append(make('span','family-member-name',member.name),make('span','family-member-meta',data.events.filter(event=>event.memberId===member.id).length+' načrtov'));
   identity.append(avatar,label);
   const remove=make('button','family-member-remove','×');
   remove.type='button';remove.setAttribute('aria-label','Odstrani člana '+member.name);remove.dataset.removeMember=member.id;
   row.append(identity,remove);list.append(row);
  }
  const select=eventForm.elements.namedItem('memberId');
  const selected=select.value;
  select.replaceChildren(new Option('Za vso družino',''));
  for(const member of data.members)select.add(new Option(member.name,member.id));
  if(data.members.some(member=>member.id===selected))select.value=selected;
  $('[data-family-stat=members]').textContent=String(data.members.length);
 }
 function occurrenceForDate(date){
  return occurrences().filter(item=>item.date===date);
 }
 function memberDot(member){
  const dot=make('i','family-member-dot');
  dot.dataset.familyColor=member?member.color:'blue';
  return dot;
 }
 function renderWeek(){
  const board=$('[data-family-week]');
  board.replaceChildren();
  renderWeekHeading();
  const days=core.weekDays(weekStart),weekEntries=occurrences(),meals=weekMeals();
  for(const date of days){
   const box=make('article','family-day'+(date===today?' is-today':''));
   const heading=make('div','family-day__heading');
   const dayName=firstUpper(shortDayFormatter.format(dateObject(date)));
   const label=make('span','family-day__name',dayName);
   const number=make('span','family-day__number',String(dateObject(date).getUTCDate()));
   heading.append(label,number);box.append(heading);
   const items=weekEntries.filter(item=>item.date===date);
   const meal=meals.find(item=>item.date===date);
   if(meal){
    const row=make('div','family-day__item is-meal');row.append(make('i'),make('span','',meal.title));box.append(row);
   }
   for(const item of items.slice(0,3)){
    const event=item.event,member=memberById(event.memberId);
    const row=make('div','family-day__item'+(event.kind==='event'?'':' is-task'));
    row.append(memberDot(member));
    const time=event.time?event.time+' · ':'';
    row.append(make('span','',time+event.title));box.append(row);
   }
   const more=items.length+(meal?1:0)-3;
   if(more>0)box.append(make('p','family-day__empty','+'+more+' načrtov'));
   else if(!items.length&&!meal)box.append(make('p','family-day__empty','Še brez načrtov'));
   const add=make('button','family-day__add','+ Dodaj');
   add.type='button';add.dataset.familyAddFor=date;add.setAttribute('aria-label','Dodaj načrt za '+formatDate(date));
   box.append(add);board.append(box);
  }
 }
 const kindLabel=kind=>kind==='chore'?'Domače opravilo':kind==='task'?'Opravilo':'Dogodek';
 function toggleDone(event,date){
  const dates=new Set(event.doneDates||[]);
  if(dates.has(date))dates.delete(date);else dates.add(date);
  event.doneDates=Array.from(dates);
  persist(eventStatus,'Stanje opravila je shranjeno.');
 }
 function editEvent(event){
  eventForm.elements.namedItem('id').value=event.id;
  eventTitle.value=event.title;
  eventDate.value=event.date;
  eventForm.elements.namedItem('time').value=event.time||'';
  eventForm.elements.namedItem('endTime').value=event.endTime||'';
  eventForm.elements.namedItem('kind').value=event.kind;
  eventForm.elements.namedItem('memberId').value=event.memberId||'';
  eventForm.elements.namedItem('repeat').value=event.repeat||'none';
  eventForm.elements.namedItem('reminder').value=String(event.reminder||0);
  $('[data-family-event-submit]').textContent='Shrani spremembe';
  $('[data-family-event-cancel]').hidden=false;
  eventTitle.focus();
 }
 function resetEventForm(){
  eventForm.reset();
  eventForm.elements.namedItem('id').value='';
  eventDate.value=weekStart===core.mondayISO(today)?today:weekStart;
  $('[data-family-event-submit]').textContent='Shrani načrt';
  $('[data-family-event-cancel]').hidden=true;
 }
 function renderAgenda(){
  const list=$('[data-family-agenda]');
  list.replaceChildren();
  const rows=occurrences();
  if(!rows.length){
   const empty=make('div','family-agenda-empty','Ta teden še nima načrtov. Dodajte dogodek, opravilo ali ponavljajočo se domačo nalogo.');
   list.append(empty);
  }
  for(const item of rows){
   const event=item.event,member=memberById(event.memberId),done=(event.doneDates||[]).includes(item.date);
   const row=make('article','family-agenda-row'+(done?' is-complete':''));
   const stripe=make('span','family-agenda-color');stripe.dataset.familyColor=member?member.color:'blue';
   const content=make('div');
   const meta=[kindLabel(event.kind),firstUpper(formatDate(item.date,monthFormatter)),event.time,event.repeat==='weekly'?'Ponavlja se tedensko':'',member?member.name:'Vsa družina'].filter(Boolean).join(' · ');
   content.append(make('strong','family-agenda-title',event.title),make('span','family-agenda-meta',meta));
   row.append(stripe,content);
   if(event.kind!=='event'){
    const check=make('input','family-agenda-check');check.type='checkbox';check.checked=done;
    check.setAttribute('aria-label',(done?'Označeno':'Označi kot opravljeno')+': '+event.title+' · '+formatDate(item.date));
    check.addEventListener('change',()=>toggleDone(event,item.date));row.append(check);
   }else row.append(make('span',''));
   const actions=make('div','family-agenda-actions');
   const edit=make('button','','Uredi');edit.type='button';edit.addEventListener('click',()=>editEvent(event));
   const remove=make('button','','Odstrani');remove.type='button';remove.addEventListener('click',()=>{
    data.events=data.events.filter(item=>item.id!==event.id);
    persist(eventStatus,'Načrt je odstranjen.');
   });
   actions.append(edit,remove);row.append(actions);list.append(row);
  }
  const plans=rows.length+weekMeals().length;
  $('[data-family-stat=plans]').textContent=String(plans);
  const tasks=rows.filter(item=>item.event.kind!=='event');
  const finished=tasks.filter(item=>(item.event.doneDates||[]).includes(item.date)).length;
  $('[data-family-stat=tasks]').textContent=finished+' / '+tasks.length;
 }
 function renderMeals(){
  const list=$('[data-family-meals-list]');
  list.replaceChildren();
  const rows=weekMeals();
  if(!rows.length)list.append(make('div','family-agenda-empty','Za ta teden še ni načrtovanih obrokov. Shranite večerjo in sestavine dodajte na nakupovalni seznam.'));
  for(const meal of rows){
   const row=make('article','family-meal-row');
   const day=make('span','family-meal-date',String(dateObject(meal.date).getUTCDate()));
   const content=make('div');
   content.append(make('strong','family-meal-title',meal.title),make('span','family-meal-ingredients',meal.ingredients.length?meal.ingredients.join(' · '):'Sestavine še niso dodane'));
   const actions=make('div','family-meal-actions');
   const shopping=make('button','','Dodaj sestavine na seznam');shopping.type='button';shopping.disabled=!meal.ingredients.length;
   shopping.addEventListener('click',()=>addMealIngredients(meal));
   const edit=make('button','','Uredi');edit.type='button';edit.addEventListener('click',()=>editMeal(meal));
   const remove=make('button','','Odstrani');remove.type='button';remove.addEventListener('click',()=>{
    data.meals=data.meals.filter(item=>item.id!==meal.id);
    persist(mealStatus,'Obrok je odstranjen.');
   });
   actions.append(shopping,edit,remove);row.append(day,content,actions);list.append(row);
  }
 }
 function editMeal(meal){
  mealForm.elements.namedItem('id').value=meal.id;
  mealDate.value=meal.date;
  mealForm.elements.namedItem('title').value=meal.title;
  mealForm.elements.namedItem('ingredients').value=meal.ingredients.join(', ');
  $('[data-family-meal-cancel]').hidden=false;
  mealForm.elements.namedItem('title').focus();
 }
 function resetMealForm(){
  mealForm.reset();
  mealForm.elements.namedItem('id').value='';
  mealDate.value=weekStart===core.mondayISO(today)?today:weekStart;
  $('[data-family-meal-cancel]').hidden=true;
 }
 const normalized=value=>value.trim().toLocaleLowerCase('sl-SI');
 function addMealIngredients(meal){
  let added=0;
  for(const name of meal.ingredients){
   if(data.groceries.some(item=>normalized(item.name)===normalized(name)))continue;
   data.groceries.push({id:makeId(),name,quantity:'',category:'Ostalo',bought:false});added++;
  }
  persist(groceryStatus,added?added+' sestavin je dodanih na seznam.':'Vse sestavine so že na seznamu.');
 }
 function renderGroceries(){
  const list=$('[data-family-groceries]');
  list.replaceChildren();
  const outstanding=data.groceries.filter(item=>!item.bought),bought=data.groceries.filter(item=>item.bought);
  if(!data.groceries.length)list.append(make('div','family-grocery-empty','Seznam je prazen. Dodajte izdelek ali sestavine načrtovanega obroka.'));
  for(const item of [...outstanding,...bought]){
   const row=make('div','family-grocery-row'+(item.bought?' is-bought':''));
   const check=make('input');check.type='checkbox';check.checked=item.bought;check.setAttribute('aria-label',(item.bought?'Kupljeno':'Označi kupljeno')+': '+item.name);
   check.addEventListener('change',()=>{item.bought=check.checked;persist(groceryStatus,'Nakupovalni seznam je shranjen.')});
   const name=make('div');
   name.append(make('span','family-grocery-name',item.name));
   const detail=[item.quantity,item.category].filter(Boolean).join(' · ');
   if(detail)name.append(make('span','family-grocery-detail',detail));
   const remove=make('button','family-grocery-remove','×');remove.type='button';remove.setAttribute('aria-label','Odstrani izdelek '+item.name);
   remove.addEventListener('click',()=>{data.groceries=data.groceries.filter(other=>other.id!==item.id);persist(groceryStatus,'Izdelek je odstranjen.')});
   row.append(check,name,remove);list.append(row);
  }
  const count=outstanding.length;
  $('[data-family-grocery-count]').textContent=count+' '+(count===1?'izdelek':count>=2&&count<=4?'izdelki':'izdelkov');
  $('[data-family-stat=groceries]').textContent=String(count);
  $('[data-family-clear-groceries]').hidden=!bought.length;
 }
 function renderNext(){
  const box=$('[data-family-next]');
  box.replaceChildren();
  const rows=occurrences().filter(item=>item.date>=today&&!((item.date===today)&&item.event.time&&item.event.time<new Date().toTimeString().slice(0,5)));
  const next=rows[0];
  if(!next){box.append(make('div','family-next-empty','Za ta teden ni več prihodnjih načrtov. Z naslednjim tednom se prikažejo novi.'));
   return;
  }
  const event=next.event,member=memberById(event.memberId);
  const item=make('div','family-next-item'+(event.kind==='event'?'':' is-task'));
  item.append(make('strong','',event.title),make('span','',firstUpper(formatDate(next.date,monthFormatter))+(event.time?' ob '+event.time:'')+' · '+(member?member.name:'Vsa družina')));
  box.append(item);
 }
 function renderAll(){
  renderMembers();
  renderWeek();
  renderAgenda();
  renderMeals();
  renderGroceries();
  renderNext();
 }
 function focusEventForDate(date){
  eventDate.value=date;
  eventForm.scrollIntoView({behavior:'smooth',block:'center'});
  eventTitle.focus({preventScroll:true});
 }
 $$('[data-family-focus]').forEach(button=>button.addEventListener('click',()=>{
  const target=$('#'+button.dataset.familyFocus);
  if(target){target.scrollIntoView({behavior:'smooth',block:'center'});target.focus({preventScroll:true})}
 }));
 $('[data-family-print]').addEventListener('click',()=>window.print());
 $('[data-family-prev-week]').addEventListener('click',()=>{
  weekStart=core.addDays(weekStart,-7);setDateDefaults();renderAll();
 });
 $('[data-family-next-week]').addEventListener('click',()=>{
  weekStart=core.addDays(weekStart,7);setDateDefaults();renderAll();
 });
 $('[data-family-this-week]').addEventListener('click',()=>{
  weekStart=core.mondayISO(core.todayISO());setDateDefaults();renderAll();
 });
 $('[data-family-week]').addEventListener('click',event=>{
  const button=event.target.closest('[data-family-add-for]');
  if(button)focusEventForDate(button.dataset.familyAddFor);
 });
 memberForm.addEventListener('submit',event=>{
  event.preventDefault();
  const name=memberForm.elements.namedItem('name').value.trim();
  const color=core.colors.includes(memberForm.elements.namedItem('color').value)?memberForm.elements.namedItem('color').value:'blue';
  if(!name){say(memberStatus,'Vnesite ime družinskega člana.',true);return}
  if(data.members.length>=8){say(memberStatus,'Dodate lahko največ 8 članov.',true);return}
  if(data.members.some(member=>normalized(member.name)===normalized(name))){say(memberStatus,'To ime je že na seznamu.',true);return}
  data.members.push({id:makeId(),name,color});
  memberForm.reset();
  persist(memberStatus,'Član družine je dodan.');
 });
 $('[data-family-members]').addEventListener('click',event=>{
  const button=event.target.closest('[data-remove-member]');
  if(!button)return;
  const member=memberById(button.dataset.removeMember);
  if(!member)return;
  data.events.forEach(item=>{if(item.memberId===member.id)item.memberId=''});
  data.members=data.members.filter(item=>item.id!==member.id);
  persist(memberStatus,'Član je odstranjen. Dogodki so ostali v skupnem družinskem koledarju.');
 });
 eventForm.addEventListener('submit',event=>{
  event.preventDefault();
  const entry={
   id:eventForm.elements.namedItem('id').value||makeId(),
   title:eventTitle.value.trim(),
   date:eventDate.value,
   time:eventForm.elements.namedItem('time').value,
   endTime:eventForm.elements.namedItem('endTime').value,
   kind:eventForm.elements.namedItem('kind').value,
   memberId:eventForm.elements.namedItem('memberId').value,
   repeat:eventForm.elements.namedItem('repeat').value,
   reminder:Number(eventForm.elements.namedItem('reminder').value),
   doneDates:[]
  };
  const existing=data.events.find(item=>item.id===entry.id);
  if(existing)entry.doneDates=existing.doneDates||[];
  if(!entry.title||!core.validISO(entry.date)){say(eventStatus,'Vnesite naslov in veljaven datum.',true);return}
  if(entry.time&&!core.validTime(entry.time)){say(eventStatus,'Preverite uro začetka.',true);return}
  if(entry.endTime&&(!entry.time||!core.validTime(entry.endTime)||entry.endTime<=entry.time)){say(eventStatus,'Konec mora biti po začetni uri.',true);return}
  if(!core.kinds.includes(entry.kind)){say(eventStatus,'Izberite vrsto načrta.',true);return}
  if(!['none','weekly'].includes(entry.repeat)){say(eventStatus,'Izberite veljavno ponavljanje.',true);return}
  if(existing)data.events=data.events.map(item=>item.id===entry.id?entry:item);
  else{
   if(data.events.length>=300){say(eventStatus,'Shranjujete lahko do 300 načrtov.',true);return}
   data.events.push(entry);
  }
  resetEventForm();
  persist(eventStatus,'Načrt je shranjen v tem brskalniku.');
 });
 $('[data-family-event-cancel]').addEventListener('click',()=>{
  resetEventForm();say(eventStatus,'Urejanje je preklicano.');
 });
 mealForm.addEventListener('submit',event=>{
  event.preventDefault();
  const id=mealForm.elements.namedItem('id').value;
  const date=mealDate.value;
  const title=mealForm.elements.namedItem('title').value.trim();
  const ingredients=mealForm.elements.namedItem('ingredients').value.split(/,|\n/).map(item=>item.trim()).filter(Boolean).slice(0,30);
  if(!core.validISO(date)||!title){say(mealStatus,'Vnesite veljaven dan in ime obroka.',true);return}
  const sameDay=data.meals.find(item=>item.date===date&&item.id!==id);
  if(sameDay){
   say(mealStatus,'Za ta dan že obstaja obrok. Uredite obstoječi zapis.',true);return;
  }
  const meal={id:id||makeId(),date,title,ingredients};
  if(id)data.meals=data.meals.map(item=>item.id===id?meal:item);
  else{
   if(data.meals.length>=120){say(mealStatus,'Shranjujete lahko do 120 obrokov.',true);return}
   data.meals.push(meal);
  }
  resetMealForm();
  persist(mealStatus,'Obrok je shranjen.');
 });
 $('[data-family-meal-cancel]').addEventListener('click',()=>{
  resetMealForm();say(mealStatus,'Urejanje je preklicano.');
 });
 $('[data-family-meals-list]').addEventListener('click',()=>{});
 $('[data-family-grocery-form]').addEventListener('submit',event=>{
  event.preventDefault();
  const form=event.currentTarget,name=form.elements.namedItem('name').value.trim();
  if(!name){say(groceryStatus,'Vnesite ime izdelka.',true);return}
  const existing=data.groceries.find(item=>normalized(item.name)===normalized(name));
  if(existing){
   existing.bought=false;
   if(form.elements.namedItem('quantity').value.trim())existing.quantity=form.elements.namedItem('quantity').value.trim();
   existing.category=form.elements.namedItem('category').value;
   form.reset();form.elements.namedItem('category').value='Ostalo';
   persist(groceryStatus,'Izdelek je že na seznamu; posodobil sem ga.');
   return;
  }
  if(data.groceries.length>=300){say(groceryStatus,'Shranjujete lahko do 300 izdelkov.',true);return}
  data.groceries.push({id:makeId(),name,quantity:form.elements.namedItem('quantity').value.trim(),category:form.elements.namedItem('category').value,bought:false});
  form.reset();form.elements.namedItem('category').value='Ostalo';
  persist(groceryStatus,'Izdelek je dodan na seznam.');
 });
 $('[data-family-clear-groceries]').addEventListener('click',()=>{
  data.groceries=data.groceries.filter(item=>!item.bought);
  persist(groceryStatus,'Kupljeni izdelki so odstranjeni.');
 });
 function download(blob,name){
  const url=URL.createObjectURL(blob),anchor=make('a');
  anchor.href=url;anchor.download=name;anchor.style.display='none';document.body.append(anchor);anchor.click();anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 $('[data-family-export-ics]').addEventListener('click',()=>{
  try{
   const content=core.toICS(data);
   download(new Blob([content],{type:'text/calendar;charset=utf-8'}),'koledar365-druzinski-koledar.ics');
   say(backupStatus,'iCalendar je prenesen v vašo napravo.');
  }catch(error){say(backupStatus,error.message||'iCalendar ni mogoče pripraviti.',true)}
 });
 $('[data-family-backup]').addEventListener('click',()=>{
  const copy={...data,exportedAt:new Date().toISOString()};
  download(new Blob([JSON.stringify(copy,null,2)],{type:'application/json'}),'koledar365-druzinski-plan.json');
  say(backupStatus,'Varnostna kopija JSON je prenesena.');
 });
 $('[data-family-restore]').addEventListener('change',async event=>{
  const file=event.target.files&&event.target.files[0];
  if(!file)return;
  try{
   if(file.size>1024*1024)throw new Error('Izberite varnostno kopijo do 1 MB.');
   const restored=core.validateState(JSON.parse(await file.text()));
   data=restored;
   if(persist(backupStatus,'Varnostna kopija je obnovljena.'))resetEventForm();
  }catch(error){say(backupStatus,error.message||'Varnostne kopije ni mogoče obnoviti.',true)}
  finally{event.target.value=''}
 });
 if(loadError)say(backupStatus,'Shranjene podatke sem začasno odprl kot prazen načrt; izvirna kopija je ostala v tej napravi. '+loadError,true);
 setDateDefaults();
 renderAll();
})();
