'use strict';
(()=>{
  const root=document.querySelector('[data-student-timetable]');if(!root)return;
  const core=window.K365StudentCore;if(!core)return;
  const $=(selector,scope=root)=>scope.querySelector(selector),$$=(selector,scope=root)=>[...scope.querySelectorAll(selector)];
  const STORE_KEY='k365.student.timetable.v1',days=core.DAY_NAMES,kindNames=core.KIND_NAMES;
  const fresh=()=>({version:1,sample:false,lessons:[],tasks:[]});
  let state=fresh(),selectedDay=1,editingId=null;
  try{const saved=JSON.parse(localStorage.getItem(STORE_KEY)||'null');if(saved)state=core.cleanState(saved)}catch{state=fresh()}
  const save=()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify(state));return true}catch{return false}};
  const announce=(selector,message,error=false)=>{const output=$(selector);if(!output)return;output.textContent=message;output.classList.toggle('is-error',error)};
  const todayIso=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
  const addDays=(value,daysToAdd)=>{const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+daysToAdd);return d.toISOString().slice(0,10)};
  const mondayOf=value=>{const date=new Date(value+'T12:00:00Z');const day=date.getUTCDay()||7;date.setUTCDate(date.getUTCDate()-day+1);return date.toISOString().slice(0,10)};
  const formatDate=value=>new Intl.DateTimeFormat('sl-SI',{day:'numeric',month:'long'}).format(new Date(value+'T12:00:00'));
  const formatDue=task=>{const due=new Date(task.due+'T00:00:00');return new Intl.DateTimeFormat('sl-SI',{weekday:'short',day:'numeric',month:'short'}).format(due)};
  const make=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node};
  function syncPrintableEntries(){
    const controls=document.querySelector('#planner-options');if(!controls)return;
    const date=$('[data-print-week]').value||'2027-01-04',year=Number(date.slice(0,4)),month=Number(date.slice(5,7));
    controls.elements.date.value=date;controls.elements.year.value=String(year);controls.elements.month.value=String(month);controls.elements.type.value='school';
    const monday=mondayOf(date),entries=state.lessons.map(lesson=>({entry_id:lesson.id,date:addDays(monday,lesson.day-1),time:lesson.start,end_time:lesson.end,title:lesson.subject,person:lesson.teacher,room:lesson.room,notes:'Osebni šolski urnik · '+days[lesson.day],done:''}));
    const saved=window.K365PlannerBridge?.setEntries(entries);
    if(saved===false)announce('[data-student-live-status]','Tiskane predloge podpirajo največ 100 vnosov. Varnostna kopija ohrani vse tvoje podatke.',true);
  }
  function renderLessons(){
    const grid=$('[data-schedule-grid]'),empty=$('[data-schedule-empty]');grid.replaceChildren();empty.hidden=state.lessons.length>0;
    $$('[data-student-day]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.studentDay)===selectedDay)));
    for(let day=1;day<=5;day++){
      const entries=state.lessons.filter(item=>item.day===day).sort((a,b)=>a.start.localeCompare(b.start));
      const panel=make('section','student-day-panel'+(day===selectedDay?' is-active':''));panel.dataset.dayPanel=String(day);panel.setAttribute('aria-label',days[day]);
      const heading=make('h4','student-day-heading',days[day]);panel.append(heading);
      if(!entries.length){panel.append(make('p','student-day-empty','Prostor čaka na tvoj urnik.'));const add=make('button','student-text-button','＋ Dodaj uro');add.type='button';add.addEventListener('click',()=>openLessonForm(day));panel.append(add)}
      for(const lesson of entries){
        const card=make('article','student-lesson student-lesson--'+lesson.color);card.dataset.lessonId=lesson.id;
        const time=make('span','student-lesson__time',`${lesson.start}–${lesson.end}`),copy=make('div','student-lesson__copy');copy.append(make('strong','',lesson.subject));
        const meta=[lesson.room&&`Učilnica ${lesson.room}`,lesson.teacher].filter(Boolean).join(' · ');if(meta)copy.append(make('span','student-lesson__meta',meta));
        const actions=make('div','student-lesson__actions');const edit=make('button','student-icon-button','Uredi');edit.type='button';edit.setAttribute('aria-label',`Uredi ${lesson.subject}, ${days[day]}`);edit.addEventListener('click',()=>openLessonForm(day,lesson));
        const remove=make('button','student-icon-button','Odstrani');remove.type='button';remove.setAttribute('aria-label',`Odstrani ${lesson.subject}, ${days[day]}`);remove.addEventListener('click',()=>{state.lessons=state.lessons.filter(item=>item.id!==lesson.id);state.sample=false;saveAndRender('Predmet je odstranjen.')});actions.append(edit,remove);card.append(time,copy,actions);panel.append(card);
      }
      grid.append(panel);
    }
    $('[data-lesson-count]').textContent=String(state.lessons.length);
    $('[data-schedule-empty]').toggleAttribute('hidden',state.lessons.length>0);
    $('[data-sample-note]').hidden=!state.sample;
    root.classList.toggle('student-has-lessons',state.lessons.length>0);
    syncPrintableEntries();
  }
  function renderTasks(){
    const list=$('[data-task-list]');list.replaceChildren();const open=state.tasks.filter(task=>!task.done).sort((a,b)=>a.due.localeCompare(b.due)||(Number(b.priority==='high')-Number(a.priority==='high')));
    $('[data-task-count]').textContent=String(open.length);$('[data-task-progress]').textContent=`${state.tasks.length-open.length} / ${state.tasks.length}`;
    const today=todayIso(),next=open[0];$('[data-next-deadline]').textContent=next?(next.due<today?`Zamujen · ${formatDue(next)}`:formatDue(next)):'Ni rokov';
    if(!state.tasks.length){const note=make('p','student-task-empty','Dodaj domačo nalogo, preverjanje ali projekt.');list.append(note);return}
    for(const task of [...state.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||a.due.localeCompare(b.due)||(Number(b.priority==='high')-Number(a.priority==='high')))){
      const item=make('article','student-task'+(task.done?' is-done':'')+(task.priority==='high'&&!task.done?' is-priority':'')+(task.due<today&&!task.done?' is-overdue':''));item.dataset.taskId=task.id;
      const check=make('input');check.type='checkbox';check.checked=task.done;check.setAttribute('aria-label',`${task.done?'Označi kot odprto':'Označi kot opravljeno'}: ${task.title}`);check.addEventListener('change',()=>{task.done=check.checked;saveAndRender('Stanje obveznosti je posodobljeno.')});
      const body=make('div','student-task__copy');body.append(make('strong','',task.title));body.append(make('span','student-task__meta',[kindNames[task.kind],task.subject,task.due<today&&!task.done?'Zamujen rok':'',formatDue(task)].filter(Boolean).join(' · ')));
      const remove=make('button','student-icon-button','Odstrani');remove.type='button';remove.setAttribute('aria-label',`Odstrani obveznost ${task.title}`);remove.addEventListener('click',()=>{state.tasks=state.tasks.filter(row=>row.id!==task.id);saveAndRender('Obveznost je odstranjena.')});item.append(check,body,remove);list.append(item);
    }
  }
  function saveAndRender(message){
    const saved=save();renderLessons();renderTasks();
    announce('[data-student-live-status]',saved?message:'Shramba v brskalniku je polna. Prenesi varnostno kopijo in odstrani nekaj podatkov.',!saved);
  }
  function openLessonForm(day=selectedDay,lesson=null){
    const form=$('[data-lesson-form]');form.hidden=false;editingId=lesson?.id||null;form.reset();form.elements.id.value=lesson?.id||'';form.elements.day.value=String(lesson?.day||day);form.elements.subject.value=lesson?.subject||'';form.elements.start.value=lesson?.start||'08:00';form.elements.end.value=lesson?.end||'08:45';form.elements.room.value=lesson?.room||'';form.elements.teacher.value=lesson?.teacher||'';form.elements.color.value=lesson?.color||'blue';$('[data-lesson-form-title]').textContent=lesson?'Uredi predmet':'Dodaj predmet';$('[data-lesson-save]').textContent=lesson?'Shrani spremembe':'Shrani predmet';announce('[data-lesson-status]','');form.elements.subject.focus();
  }
  function closeLessonForm(){const form=$('[data-lesson-form]');form.hidden=true;form.reset();editingId=null}
  $$('[data-add-lesson-open]').forEach(button=>button.addEventListener('click',()=>openLessonForm()));
  $$('[data-lesson-cancel]').forEach(button=>button.addEventListener('click',closeLessonForm));
  $('[data-lesson-form]').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget;
    try{
      const lesson=core.validateLesson(Object.fromEntries(new FormData(form)));const conflict=state.lessons.find(item=>item.id!==lesson.id&&item.day===lesson.day&&lesson.start<item.end&&lesson.end>item.start);
      if(conflict)throw Error(`${days[lesson.day]} ob tej uri že imaš predmet »${conflict.subject}«. Uredi čas ali predmet.`);
      if(!editingId&&state.lessons.length>=100)throw Error('Shraniš lahko največ 100 ur.');
      const index=state.lessons.findIndex(item=>item.id===lesson.id);if(index>=0)state.lessons[index]=lesson;else state.lessons.push(lesson);
      selectedDay=lesson.day;state.sample=false;closeLessonForm();saveAndRender(index>=0?'Predmet je posodobljen.':'Predmet je dodan.');
    }catch(error){announce('[data-lesson-status]',error.message,true)}
  });
  $$('[data-student-day]').forEach(button=>button.addEventListener('click',()=>{selectedDay=Number(button.dataset.studentDay);renderLessons()}));
  $('[data-task-form]').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget,raw=Object.fromEntries(new FormData(form));
    try{if(state.tasks.length>=200)throw Error('Shraniš lahko največ 200 obveznosti.');const task=core.validateTask(raw);state.tasks.push(task);state.sample=false;form.reset();saveAndRender('Obveznost je shranjena.');form.elements.title.focus()}catch(error){announce('[data-task-status]',error.message,true)}
  });
  $('[data-load-sample]').addEventListener('click',()=>{
    if(state.lessons.length){announce('[data-student-live-status]','Označen primer je na voljo, dokler urnik ne vsebuje predmetov. Po potrebi predmete najprej odstrani.',true);return}
    const demo=[{day:1,subject:'Matematika',start:'08:00',end:'08:45',room:'12',color:'blue'},{day:2,subject:'Slovenščina',start:'09:00',end:'09:45',room:'7',color:'red'},{day:3,subject:'Naravoslovje',start:'10:00',end:'10:45',room:'Laboratorij',color:'navy'},{day:4,subject:'Angleščina',start:'08:00',end:'08:45',room:'18',color:'blue'},{day:5,subject:'Zgodovina',start:'11:00',end:'11:45',room:'5',color:'red'}].map(item=>core.validateLesson(item));
    state.lessons.push(...demo);state.sample=true;saveAndRender('Prikazan je samo primer. Uredi ga z dejanskimi podatki svoje šole.');
  });
  $('[data-print-schedule]').addEventListener('click',()=>{const range=$('[data-student-print-range]');range.textContent=`Tedenski pregled · teden od ${formatDate(mondayOf($('[data-print-week]').value||todayIso()))}`;window.print()});
  $('[data-print-week]').addEventListener('change',event=>{const date=event.currentTarget.value;if(!core.validDate(date)||Number(date.slice(0,4))<2027||Number(date.slice(0,4))>2030){announce('[data-student-live-status]','Za predlogo izberi datum med letoma 2027 in 2030.',true);event.currentTarget.value='2027-01-04';return}syncPrintableEntries()});
  $('[data-export-ics]').addEventListener('click',()=>{
    try{const text=core.buildIcs(state,$('[data-ics-from]').value,$('[data-ics-until]').value);const blob=new Blob([text],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),link=make('a');link.href=url;link.download='koledar365-moj-solski-urnik.ics';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);announce('[data-student-live-status]','ICS koledar je prenesen. Predmeti in odprti roki so v datoteki.')}catch(error){announce('[data-student-live-status]',error.message,true)}
  });
  $('[data-student-backup]').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({...state,version:1},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=make('a');link.href=url;link.download='koledar365-moj-solski-urnik.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);announce('[data-backup-status]','Varnostna kopija je prenesena.')});
  $('[data-student-restore]').addEventListener('change',async event=>{
    try{const file=event.currentTarget.files[0];if(!file)return;if(file.size>1000000)throw Error('Izberi varnostno kopijo, manjšo od 1 MB.');state=core.cleanState(JSON.parse(await file.text()));if(!save())throw Error('Kopije ni mogoče shraniti. V brskalniku ni dovolj prostora.');state.sample=false;renderLessons();renderTasks();announce('[data-backup-status]','Urnik in obveznosti so obnovljeni.')}catch(error){announce('[data-backup-status]',error.message,true)}finally{event.currentTarget.value=''}
  });
  const clock=$('[data-focus-clock]'),startButton=$('[data-focus-start]'),lengthInput=$('[data-focus-length]');let focusDeadline=0,focusTimer=null,focusPaused=null,focusMode='study';
  const showClock=seconds=>{clock.textContent=`${String(Math.floor(Math.max(0,seconds)/60)).padStart(2,'0')}:${String(Math.max(0,seconds)%60).padStart(2,'0')}`};
  const beginFocus=(seconds,mode)=>{focusMode=mode;focusDeadline=Date.now()+seconds*1000;focusPaused=null;clearInterval(focusTimer);const tick=()=>{const left=Math.ceil((focusDeadline-Date.now())/1000);showClock(left);if(left<=0){clearInterval(focusTimer);focusTimer=null;startButton.textContent='Začni 25 minut';announce('[data-focus-status]',mode==='study'?'Odlično opravljeno. Vzemi si kratek odmor. Čas za premor!':'Premor je končan. Ko boš pripravljen/-a, začni nov sprint.');if(mode==='study')root.classList.add('student-focus-complete');else root.classList.remove('student-focus-complete');}};tick();focusTimer=setInterval(tick,500);startButton.textContent='Začasno ustavi';announce('[data-focus-status]',mode==='study'?'Osredotoči se na eno nalogo.':'Kratek odmor. Odmakni se od zaslona.');};
  startButton.addEventListener('click',()=>{if(focusTimer){focusPaused=Math.max(0,Math.ceil((focusDeadline-Date.now())/1000));clearInterval(focusTimer);focusTimer=null;startButton.textContent='Nadaljuj';announce('[data-focus-status]','Čas je ustavljen.');return}const duration=focusPaused??(Number(lengthInput.value)*60);beginFocus(duration,focusPaused===null?'study':focusMode)});
  $('[data-focus-reset]').addEventListener('click',()=>{clearInterval(focusTimer);focusTimer=null;focusPaused=null;root.classList.remove('student-focus-complete');showClock(Number(lengthInput.value)*60);startButton.textContent='Začni';announce('[data-focus-status]','Po intervalu si vzemi kratek odmor.')});
  lengthInput.addEventListener('change',()=>{if(!focusTimer&&focusPaused===null){showClock(Number(lengthInput.value)*60);announce('[data-focus-status]','Po intervalu si vzemi kratek odmor.')}});
  renderLessons();renderTasks();showClock(Number(lengthInput.value)*60);
})();
