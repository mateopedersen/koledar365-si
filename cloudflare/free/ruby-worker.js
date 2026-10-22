/* Ruby engine runs in a dedicated browser worker. No visitor content is sent out. */
importScripts('/free/vendor/ruby.umd.js');
let instance;
async function engine(){
 if(!instance){instance=(async()=>{
  const manifest=await fetch('/free/runtime.json').then(r=>r.json());
  const chunks=await Promise.all(manifest.parts.map(async part=>{const bytes=new Uint8Array(await fetch(part.path).then(r=>r.arrayBuffer()));const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==part.sha256)throw Error('Datoteka za izračun ni veljavna. Osvežite stran.');return bytes}));
  const bytes=new Uint8Array(chunks.reduce((n,x)=>n+x.length,0));let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  const binary=manifest.encoding==='gzip'?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():bytes;
  const {vm}=await self['ruby-wasm-wasi'].DefaultRubyVM(await WebAssembly.compile(binary));vm.eval('require "/app/boot"');return vm;
 })()}
 return instance;
}
const base64=value=>{const data=new TextEncoder().encode(value);let encoded='';for(let i=0;i<data.length;i+=32768)encoded+=String.fromCharCode(...data.subarray(i,i+32768));return btoa(encoded)};
let queue=Promise.resolve();
self.onmessage=event=>{
 const {id,path,data}=event.data;
 queue=queue.then(async()=>{
  let vm;
  try{vm=await engine()}
  catch{self.postMessage({id,fatal:true});return}
  try{
   const response=JSON.parse(vm.eval(`PortableApplication.json(Base64.strict_decode64("${base64(path)}"),Base64.strict_decode64("${base64(JSON.stringify(data))}"))`).toString());
   if(!response.ok){self.postMessage({id,error:response.error});return}
   vm.eval('GC.start');
   self.postMessage({id,result:response.result});
  }catch(error){
   if(error instanceof WebAssembly.RuntimeError)self.postMessage({id,fatal:true});
   else self.postMessage({id,error:error.message||'Izračun ni uspel.'});
  }
 });
};
