export function readChecklist(value) {
  try { const parsed=JSON.parse(value); return Array.isArray(parsed)&&parsed.length===3&&parsed.every(x=>typeof x==='boolean') ? parsed : [false,false,false]; } catch { return [false,false,false]; }
}
export function initChecklist(root, storage=globalThis.localStorage) {
  const key=`k365.topic-preparation.v1:${location.pathname}`;
  const boxes=[...root.querySelectorAll('[data-topic-check]')];
  let state=[false,false,false];
  try { state=readChecklist(storage.getItem(key)); } catch { root.querySelector('[data-topic-check-status]').textContent='Shramba ni na voljo. Izbor velja do zaprtja strani.'; }
  function render(){boxes.forEach((box,i)=>box.checked=state[i]);const count=state.filter(Boolean).length;root.querySelector('[data-topic-progress]').textContent=`Opravljeno: ${count} od ${boxes.length}`;root.querySelector('[data-topic-progress-bar]').style.width=`${count/boxes.length*100}%`;}
  function save(){try{storage.setItem(key,JSON.stringify(state));}catch{root.querySelector('[data-topic-check-status]').textContent='Izbora ni mogoče shraniti. Velja do zaprtja strani.';}render();}
  boxes.forEach((box,i)=>box.addEventListener('change',()=>{state[i]=box.checked;save();}));
  root.querySelector('[data-topic-reset]').addEventListener('click',()=>{state=[false,false,false];save();});render();root.dataset.ready='true';
}
if(typeof document!=='undefined'){
  document.querySelectorAll('[data-topic-checklist]').forEach(root=>{let storage;try{storage=globalThis.localStorage;}catch{}initChecklist(root,storage||{getItem(){throw Error();},setItem(){throw Error();}});});
  document.querySelectorAll('[data-topic-category]').forEach(button=>button.addEventListener('click',()=>{const select=document.querySelector('[data-ed-filters] [name=category]');select.value=button.dataset.topicCategory;select.dispatchEvent(new Event('change',{bubbles:true}));}));
}
