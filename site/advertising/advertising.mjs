// The displayed sponsor link is ordinary first-party HTML and never depends on a cookie choice.
const configNode=document.getElementById('advertising-config');
let config;try{config=JSON.parse(configNode?.textContent||'null');}catch{}
if(config?.mode==='sponsored-link'){
 const title='Nastavitve piškotkov',labels={deny:'Samo nujni',allow:'Dovoli vse',save:'Shrani izbiro',close:'Zapri'};
 const key='koledar365:cookie-preferences:v1',ttl=180*86400000;
 const read=()=>{try{const v=JSON.parse(localStorage.getItem(key)||'null');return v?.version===1&&Number.isFinite(v.expiresAt)&&v.expiresAt>Date.now()&&v.expiresAt<=v.savedAt+ttl?v:null;}catch{return null;}};
 let answered=read(),opener;
 const analytics=()=>window.Calendar365Analytics||window.K365Analytics;
 const preferences=()=>window.K365Preferences;
 const dialog=document.createElement('dialog');dialog.className='advertising-dialog';dialog.setAttribute('aria-labelledby','cookie-settings-title');
 const heading=document.createElement('h2');heading.id='cookie-settings-title';heading.textContent=title;
 const copy=document.createElement('p');copy.textContent='Nenujna hramba je izbirna. Oglasna povezava je vidna tudi, če izberete samo nujne piškotke. Sponzorju ne pošiljamo vaših načrtov ali izpolnjenih obrazcev.';
 const ga=document.createElement('input');ga.type='checkbox';const gaLabel=document.createElement('label');gaLabel.append(ga,document.createTextNode('Analitika (Google Analytics)'));
 const city=document.createElement('input');city.type='checkbox';const cityLabel=document.createElement('label');cityLabel.append(city,document.createTextNode('Zapomni si izbrano mesto'));
 const actions=document.createElement('div');actions.className='advertising-choice-actions';
 for(const action of ['deny','allow','save','close']){const b=document.createElement('button');b.type='button';b.dataset.advertisingChoice=action;b.textContent=labels[action];actions.append(b);}
 const policy=document.createElement('a');policy.href='/piskotki/';policy.textContent='Politika piškotkov';dialog.append(heading,copy,gaLabel,cityLabel,actions,policy);document.body.append(dialog);
 const banner=document.createElement('section');banner.className='cookie-choice-banner';banner.setAttribute('aria-label',title);const text=document.createElement('p');text.textContent='Vi izberete, ali si zapomnimo mesto in vključimo razpoložljivo analitiko. Oglasna povezava deluje brez oglasnih piškotkov.';banner.append(text);
 for(const [action,label]of [['deny',labels.deny],['allow',labels.allow],['customize',title]]){const b=document.createElement('button');b.type='button';b.dataset.advertisingChoice=action;b.textContent=label;banner.append(b);}document.body.append(banner);
 const known=()=>{try{const v=JSON.parse(localStorage.getItem('k365.consent')||'null');return v?.version===2&&v.expiresAt>Date.now();}catch{return false;}};
 const update=()=>{banner.hidden=!!answered||known();gaLabel.hidden=!analytics();cityLabel.hidden=!preferences();};
 const open=control=>{opener=control;ga.checked=analytics()?.choice()?.analytics===true;city.checked=preferences()?.choice()?.preferences===true;update();if(!dialog.open)dialog.showModal();};
 const close=()=>{dialog.close();if(opener?.isConnected)opener.focus({preventScroll:true});};
 const choose=action=>{const all=action==='allow',none=action==='deny';if(analytics()?.choose)analytics().choose(all||!none&&ga.checked);if(preferences()?.choose)preferences().choose(all||!none&&city.checked);answered={version:1,savedAt:Date.now(),expiresAt:Date.now()+ttl};try{localStorage.setItem(key,JSON.stringify(answered));}catch{}update();close();};
 document.addEventListener('click',event=>{const b=event.target.closest?.('[data-cookie-preferences],[data-cookie-open],[data-advertising-open],[data-advertising-choice]');if(!b)return;event.preventDefault();const action=b.dataset.advertisingChoice;if(!action||action==='customize')open(b);else if(action==='close')close();else choose(action);});
 window.addEventListener('storage',event=>{if(event.key===key||event.key==='k365.consent'||event.key===null){answered=read();update();}});
 document.addEventListener('DOMContentLoaded',update);window.addEventListener('load',update);update();
}
