import {cityPhotoState} from './state-8f37e36480e7f760.mjs';
import {createCityPhotoController} from './controller-d64a383276d8d3d3.mjs';
export function createSiteCityPhotos(card,select){
 const options=[...select.options],cities=options.map(option=>({id:option.value,name:option.textContent.trim(),latitude:Number(option.dataset.latitude),longitude:Number(option.dataset.longitude),timeZone:'Europe/Ljubljana'}));
 const day=Object.fromEntries(options.map(o=>[o.value,{image:o.dataset.photo,srcset:o.dataset.photoSrcset,avif:o.dataset.photoAvif}]));
 const night=Object.fromEntries(options.filter(o=>o.dataset.nightPhoto).map(o=>[o.value,{image:o.dataset.nightPhoto}]));
 const sizes=card.querySelector('#city-photo').sizes;
 const controller=createCityPhotoController({cities,day,night,stateFor:cityPhotoState,
  load:photo=>new Promise((resolve,reject)=>{
   const frame=document.createElement('picture'),source=document.createElement('source'),image=new Image();
   source.type='image/avif';source.sizes=sizes;source.srcset=photo.avif||'';frame.append(source,image);frame.hidden=true;card.append(frame);
   let settled=false;
   const timeout=setTimeout(()=>{frame.remove();reject(Error('Photo timeout'));},15000);
   image.onload=async()=>{if(settled)return;settled=true;image.onload=null;image.onerror=null;try{await image.decode();clearTimeout(timeout);frame.remove();resolve(frame);}catch(error){clearTimeout(timeout);frame.remove();reject(error);}};
   image.onerror=()=>{clearTimeout(timeout);frame.remove();reject(Error('Photo unavailable'));};
   image.sizes=sizes;image.srcset=photo.srcset||'';image.decoding='async';image.src=photo.image;
  }),
  async display({city,period,frame,isCurrent}){
   const current=card.querySelector('#city-photo'),picture=current.closest('picture');
   // A detached picture may restart responsive source selection in Chromium.
   // Decode a separate final-DOM frame while the current photograph stays visible.
   const incoming=frame.cloneNode(true),image=incoming.querySelector('img');
   incoming.hidden=false;incoming.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none';
   picture.after(incoming);
   try{
    await new Promise(resolve=>requestAnimationFrame(resolve));
    await image.decode();
    if(!isCurrent()||!image.complete||!image.naturalWidth){incoming.remove();return false;}
    for(const attr of [...current.attributes])if(!['src','srcset','alt','loading','decoding','id'].includes(attr.name))image.setAttribute(attr.name,attr.value);
    image.id='city-photo';image.alt=city.name+' – '+(period==='night'?'pogled po sončnem zahodu':period==='day'?'pogled podnevi':'arhivska fotografija');
    incoming.querySelector('source').id='city-photo-avif';
    picture.remove();incoming.removeAttribute('style');
    card.querySelector('#city-caption').textContent=city.name+', Slovenija';
    card.querySelector('#city-credit').href='/fotografije-in-licence/#'+city.id+(period==='night'?'-noc':'');
    card.querySelector('figure').dataset.photoCity=city.id;
    card.querySelector('figure').dataset.photoPeriod=period;
    return true;
   }catch(error){incoming.remove();throw error;}
  }
 });
 const warm=()=>{const at=cities.findIndex(city=>city.id===select.value);for(const city of cities.slice(Math.max(0,at-2),at+3))void controller.preload(city.id);};
 select.addEventListener('focus',warm);select.addEventListener('pointerdown',warm,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void controller.update();});
 window.addEventListener('pageshow',()=>{void controller.update();});
 setInterval(()=>{if(!document.hidden)void controller.update();},30000);
 return controller;
}
