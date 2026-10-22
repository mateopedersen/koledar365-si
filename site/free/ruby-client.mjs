// A trapped Wasm VM cannot be reused. Replay each pure calculation at most once
// in a fresh worker; ordinary Ruby validation errors must reach the caller.
export function createRubyClient(makeWorker=()=>new Worker('/free/ruby-worker.js')){
 let worker,sequence=0;
 const pending=new Map();
 const unavailable='Brskalnik ni mogel pripraviti izračuna. Poskusite znova.';
 function start(){
  if(worker)return worker;
  const current=worker=makeWorker();
  current.onmessage=({data})=>{
   if(worker!==current)return;
   if(data.fatal){recover(current);return}
   const task=pending.get(data.id);if(!task)return;
   pending.delete(data.id);
   data.error?task.reject(Error(data.error)):task.resolve(data.result);
  };
  current.onerror=event=>{event.preventDefault?.();recover(current)};
  current.onmessageerror=()=>recover(current);
  return current;
 }
 function send(id,task){
  try{start().postMessage({id,path:task.path,data:task.data})}
  catch(error){pending.delete(id);task.reject(error)}
 }
 function recover(current){
  if(worker!==current)return;
  current.terminate();worker=null;
  // Snapshot before replay so concurrent requests share one replacement worker.
  for(const [id,task] of [...pending]){
   if(task.retries++===0)send(id,task);
   else{pending.delete(id);task.reject(Error(unavailable))}
  }
 }
 return (path,data)=>new Promise((resolve,reject)=>{
  const id=++sequence,task={path,data,resolve,reject,retries:0};
  pending.set(id,task);send(id,task);
 });
}
