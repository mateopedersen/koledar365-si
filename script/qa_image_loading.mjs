// Drive waits from the runner, so an inactive page cannot stall its own deadline.
async function deadline(operation, milliseconds, message) {
 let timer;
 try {
  return await Promise.race([operation, new Promise((_, reject) => {
   timer=setTimeout(()=>reject(new Error(message)),milliseconds);
  })]);
 } finally { clearTimeout(timer); }
}

export async function settlePaint(page) {
 let timer;
 try {
  return await Promise.race([
   page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(false))))),
   new Promise(resolve=>{timer=setTimeout(()=>resolve(true),100);})
  ]);
 } finally { clearTimeout(timer); }
}

export async function auditImageLoading(page, progress=()=>{}) {
 let paintTimerFallbacks=0;
 const settle=async()=>{if(await settlePaint(page))paintTimerFallbacks++;};
 const retries=[];
 // Scroll directly to each rendered image below. This triggers native lazy
 // loading without spending time sweeping long text-only sections first.
 const all=await page.locator('img').elementHandles();
 const displayed=[];
 for(const image of all) {
  const visible=await image.evaluate(im=>{
   const r=im.getBoundingClientRect();
   if(!r.width||!r.height||getComputedStyle(im).visibility==='hidden')return false;
   if(typeof im.checkVisibility==='function'&&!im.checkVisibility({visibilityProperty:true,opacityProperty:true}))return false;
   const closed=im.closest('details:not([open])');
   return !closed||closed.querySelector('summary')?.contains(im);
  });
  if(visible)displayed.push(image);
 }
 try {
  for(const image of displayed) {
   const src=await image.evaluate(im=>im.currentSrc||im.src);
   const visit=async()=>{
    progress({stage:'intersection',src});
    await image.evaluate(im=>im.scrollIntoView({block:'center',inline:'nearest'}));
    await settle();
   };
   const decode=async()=>{
    progress({stage:'decode',src});
    await deadline(image.evaluate(im=>im.decode()),15000,'Image decode timed out: '+src);
    const loaded=await image.evaluate(im=>im.complete&&im.naturalWidth>0);
    if(!loaded)throw new Error('Broken image: '+src);
   };
   await visit();
   try {await decode();}
   catch(firstError) {
    retries.push({src,error:firstError.message});
    await visit();
    try {await decode();}
    catch(error) {throw new Error('Image decode failed: '+src+': '+error.message);}
   }
  }
  await page.evaluate(()=>scrollTo(0,0));
  await settle();
  progress({stage:'complete',decodedImages:displayed.length});
  return {decodedImages:displayed.length,retries,paintTimerFallbacks,visibilityState:await page.evaluate(()=>document.visibilityState)};
 } finally {await Promise.all(all.map(image=>image.dispose()));}
}
