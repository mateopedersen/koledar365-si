// Exercise the real release CLI with native lazy images and a broken image.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'evidence/qa/image-gate-controls');
let freezeFrames=false;let pageHeight=9000;
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="blue"/></svg>';
const server=http.createServer((req,res)=>{
 if(req.url==='/ok.svg'){res.writeHead(200,{'Content-Type':'image/svg+xml'});res.end(svg);return;}
 if(req.url==='/missing.webp'){res.writeHead(404);res.end('missing');return;}
 const broken=req.url.includes('socialnih');
 res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});
 res.end(`<!doctype html><html lang="sl"><meta name="viewport" content="width=device-width"><title>Image gate control</title>${freezeFrames?'<script>window.requestAnimationFrame=()=>0</script>':''}<style>body{margin:0}h1{font-size:24px}</style><main><h1>Koledar</h1><details><summary>Closed image</summary><img loading="lazy" src="/missing.webp" width="100" height="100" alt="Hidden image"></details>${broken?'':'<div style="height:'+pageHeight+'px"></div>'}<img loading="${broken?'eager':'lazy'}" src="${broken?'/missing.webp':'/ok.svg'}" width="100" height="100" alt="Visible image"></main></html>`);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const cases=[];
try{
 for(const [name,engine,route,tested,failed] of [
  ['lazy-chromium','chromium','/solski-koledar/',8,0],
  ['lazy-webkit','webkit','/solski-koledar/',2,0],
  ['lazy-webkit-tiles','webkit','/solski-koledar/',2,0],
  ['lazy-no-animation-frames','chromium','/solski-koledar/',8,0],
  ['broken-chromium','chromium','/izplacila-socialnih-transferjev/',8,8]
 ]){
  freezeFrames=name==='lazy-no-animation-frames';pageHeight=name==='lazy-webkit-tiles'?40000:9000;
  const folder=path.join(out,name);let log='';
  const code=await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['script/qa_browser.mjs'],{cwd:root,env:{...process.env,K365_BASE_URL:base,QA_MODE:'layout',QA_BROWSER:engine,QA_PATHS:route,QA_OUT:folder}});
   child.stdout.on('data',b=>log+=b);child.stderr.on('data',b=>log+=b);
   child.on('error',reject);child.on('close',resolve);
  });
  assert.equal(code,failed?1:0,name+': '+log);
  const report=JSON.parse(fs.readFileSync(path.join(folder,'layout-'+engine+'.json')));
  assert.equal(report.tested,tested,name);assert.equal(report.failed,failed,name);
  if(name==='lazy-webkit-tiles')for(const row of report.rows){
   const tiles=row.screenshotTiles;assert(tiles?.length>1,'Long WebKit page must retain all tiles');
   assert.equal(tiles[0].top,0);assert.equal(tiles.at(-1).bottom,row.screenshotHeight);
   for(let i=0;i<tiles.length;i++){
    if(i)assert(tiles[i].top<=tiles[i-1].bottom,'Screenshot tile coverage has a gap');
    const png=fs.readFileSync(path.join(folder,tiles[i].path));assert.equal(png.readUInt32BE(16),row.width);assert(png.readUInt32BE(20)<=900,'Tile exceeds viewport');
   }
  }
  if(freezeFrames)assert(report.rows.filter(row=>row.snapshot).every(row=>row.imageLoading?.paintTimerFallbacks>0&&row.imageLoading.decodedImages>0),'Animation-frame fallback must still decode visible images');
  if(failed)assert(report.rows.every(row=>!row.passed&&JSON.stringify(row).includes('/missing.webp')),name+': missing broken-image evidence');
  cases.push({name,tested,expectedFailures:failed,observedFailures:report.failed,passed:true});
 }
 fs.mkdirSync(out,{recursive:true});
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({tested:28,failed:0,cases},null,2)+'\n');
 console.log(JSON.stringify({imageGateControls:28,failed:0,cases}));
}finally{await new Promise(resolve=>server.close(resolve));}
