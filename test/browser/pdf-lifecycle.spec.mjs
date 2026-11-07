import {test,expect} from '@playwright/test';
const validPdf=[37, 80, 68, 70, 45, 49, 46, 52, 10, 49, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32, 47, 84, 121, 112, 101, 32, 47, 67, 97, 116, 97, 108, 111, 103, 32, 47, 80, 97, 103, 101, 115, 32, 50, 32, 48, 32, 82, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 50, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32, 47, 84, 121, 112, 101, 32, 47, 80, 97, 103, 101, 115, 32, 47, 75, 105, 100, 115, 32, 91, 51, 32, 48, 32, 82, 93, 32, 47, 67, 111, 117, 110, 116, 32, 49, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 51, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32, 47, 84, 121, 112, 101, 32, 47, 80, 97, 103, 101, 32, 47, 80, 97, 114, 101, 110, 116, 32, 50, 32, 48, 32, 82, 32, 47, 77, 101, 100, 105, 97, 66, 111, 120, 32, 91, 48, 32, 48, 32, 55, 50, 32, 55, 50, 93, 32, 47, 67, 111, 110, 116, 101, 110, 116, 115, 32, 52, 32, 48, 32, 82, 32, 62, 62, 10, 101, 110, 100, 111, 98, 106, 10, 52, 32, 48, 32, 111, 98, 106, 10, 60, 60, 32, 47, 76, 101, 110, 103, 116, 104, 32, 49, 53, 32, 62, 62, 10, 115, 116, 114, 101, 97, 109, 10, 48, 32, 48, 32, 49, 48, 32, 49, 48, 32, 114, 101, 32, 83, 10, 101, 110, 100, 115, 116, 114, 101, 97, 109, 10, 101, 110, 100, 111, 98, 106, 10, 120, 114, 101, 102, 10, 48, 32, 53, 10, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 32, 54, 53, 53, 51, 53, 32, 102, 32, 10, 48, 48, 48, 48, 48, 48, 48, 48, 48, 57, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 48, 48, 48, 48, 48, 48, 48, 48, 53, 56, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 48, 48, 48, 48, 48, 48, 48, 49, 49, 53, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 48, 48, 48, 48, 48, 48, 48, 50, 48, 48, 32, 48, 48, 48, 48, 48, 32, 110, 32, 10, 116, 114, 97, 105, 108, 101, 114, 10, 60, 60, 32, 47, 83, 105, 122, 101, 32, 53, 32, 47, 82, 111, 111, 116, 32, 49, 32, 48, 32, 82, 32, 62, 62, 10, 115, 116, 97, 114, 116, 120, 114, 101, 102, 10, 50, 54, 52, 10, 37, 37, 69, 79, 70, 10];
test('PDF parser and renderer failures release real PDF.js6 workers and allow a clean next request',async({page})=>{
 await page.addInitScript(()=>{
  const NativeWorker=window.Worker;
  window.__pdfLifecycle={created:0,active:0,terminated:0};
  window.Worker=class extends NativeWorker {
   constructor(url,options){super(url,options);const tracked=String(url).includes('pdf.worker');if(tracked){window.__pdfLifecycle.created++;window.__pdfLifecycle.active++;let ended=false;const terminate=this.terminate.bind(this);this.terminate=()=>{if(!ended){ended=true;window.__pdfLifecycle.active--;window.__pdfLifecycle.terminated++}return terminate()}}}
  };
 });
 await page.goto('/koledar-za-tiskanje/');
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 const result=await page.evaluate(async validBytes=>{
  const {usingPdfDocument}=await import('/free/pdf-lifecycle.mjs');
  const library=await import('/free/vendor/pdf.min.mjs');
  library.GlobalWorkerOptions.workerSrc='/free/vendor/pdf.worker.min.mjs';
  const options=data=>({data:new Uint8Array(data),isEvalSupported:false,wasmUrl:'/free/vendor/pdf-wasm/'});
  let loadError='',renderError='',rendered=false;
  try{await usingPdfDocument(library,options([0,1,2,3]),()=>{rendered=true})}catch(error){loadError=error.message}
  const afterInvalid={...window.__pdfLifecycle};
  try{await usingPdfDocument(library,options(validBytes),async()=>{throw Error('deliberate render fixture failure')})}catch(error){renderError=error.message}
  const afterRender={...window.__pdfLifecycle};
  const pages=await usingPdfDocument(library,options(validBytes),async document=>{await document.getPage(1);return document.numPages});
  return {loadError,renderError,rendered,afterInvalid,afterRender,afterSuccess:{...window.__pdfLifecycle},pages};
 },validPdf);
 expect(result.loadError).toBeTruthy();expect(result.rendered).toBe(false);
 expect(result.renderError).toBe('deliberate render fixture failure');expect(result.pages).toBe(1);
 for(const state of [result.afterInvalid,result.afterRender,result.afterSuccess]){expect(state.created).toBeGreaterThan(0);expect(state.active).toBe(0);expect(state.terminated).toBe(state.created)}
 expect(result.afterSuccess.created).toBe(3);
});

test('a failed PDF worker resolves the preview HTTP error envelope and a fresh context renders normally',async({page,browser},testInfo)=>{
 test.setTimeout(120000);
 let aborted=0;
 await page.context().route('**/free/vendor/pdf.worker.min.mjs*',route=>{aborted++;return route.abort()});
 await page.goto('/koledar-za-tiskanje/');
 const consent=page.locator('[data-consent="necessary"]');if(await consent.isVisible())await consent.click();
 await expect(page.locator('html')).toHaveAttribute('data-free-ready','true');
 const failed=await page.evaluate(async()=>{
  const button=document.querySelector('[data-personal-preview]'),section=button.closest('[data-export-options]');
  const options={...JSON.parse(section.dataset.exportOptions),design:button.dataset.personalPreview,paper:section.querySelector('.export-paper').value,orientation:section.querySelector('.export-orientation').value,entries:[]};
  try{const response=await fetch('/zasebni-predogled/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({options})});return {resolved:true,status:response.status,body:await response.json()}}catch(error){return {resolved:false,error:error.message}}
 });
 expect(aborted).toBeGreaterThan(0);expect(failed.resolved).toBe(true);expect(failed.status).toBe(422);expect(typeof failed.body.error).toBe('string');expect(failed.body.error.length).toBeGreaterThan(0);
 // Close the failed page's Ruby VM before opening a genuinely fresh context.
 await page.close();
 const profile=testInfo.project.use;
 const clean=await browser.newContext({baseURL:profile.baseURL,viewport:profile.viewport,userAgent:profile.userAgent,deviceScaleFactor:profile.deviceScaleFactor,isMobile:profile.isMobile,hasTouch:profile.hasTouch});
 try{
  const next=await clean.newPage(),errors=[];next.on('pageerror',error=>errors.push(error.message));
  await next.goto('/koledar-za-tiskanje/');
  const freshConsent=next.locator('[data-consent="necessary"]');if(await freshConsent.isVisible())await freshConsent.click();
  await expect(next.locator('html')).toHaveAttribute('data-free-ready','true');
  const card=next.locator('.design-card').first();await card.locator('[data-personal-preview]').click();
  await expect(card.locator('.export-status')).toHaveText('Vaš predogled · stran 1 od 1. Celotno datoteko prenesite s spodnjim gumbom.',{timeout:90000});
  await expect(card.locator('img[data-preview-design]')).toHaveAttribute('src',/^blob:/);expect(errors).toEqual([]);
 }finally{await clean.close()}
});
