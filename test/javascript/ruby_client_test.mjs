import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRubyClient} from '../../cloudflare/free/ruby-client.mjs';
function setup(options){
 const workers=[];
 const call=createRubyClient(()=>{
  const worker={messages:[],terminated:false,postMessage(message){this.messages.push(message)},terminate(){this.terminated=true},reply(data){this.onmessage({data})}};
  workers.push(worker);return worker;
 },options);
 return {workers,call};
}
test('a trapped VM is terminated and the real request replayed once',async()=>{
 const {workers,call}=setup(),result=call('/calculate/',{from:'2027-04-26',to:'2027-04-27'});
 const message=workers[0].messages[0];workers[0].reply({id:message.id,fatal:true});
 assert.equal(workers.length,2);assert.equal(workers[0].terminated,true);
 assert.deepEqual(workers[1].messages,[message]);
 workers[0].reply({id:message.id,result:'stale'});
 workers[1].reply({id:message.id,result:{days:1}});
 assert.deepEqual(await result,{days:1});
});
test('concurrent calculations share one fresh worker and preserve their data',async()=>{
 const {workers,call}=setup(),a=call('/a',{value:1}),b=call('/b',{value:2});
 const messages=[...workers[0].messages];workers[0].reply({id:messages[0].id,fatal:true});
 assert.equal(workers.length,2);assert.deepEqual(workers[1].messages,messages);
 workers[1].reply({id:messages[1].id,result:2});workers[1].reply({id:messages[0].id,result:1});
 assert.deepEqual(await Promise.all([a,b]),[1,2]);
});
test('a persistent runtime failure stops after two attempts with a readable error',async()=>{
 const {workers,call}=setup(),result=call('/a',{}),rejection=assert.rejects(result,/Brskalnik ni mogel pripraviti izračuna/);
 workers[0].reply({id:1,fatal:true});workers[1].reply({id:1,fatal:true});
 await rejection;assert.equal(workers.length,2);assert.ok(workers.every(w=>w.terminated));
});
test('validation errors are not retried and leave the worker available',async()=>{
 const {workers,call}=setup(),result=call('/a',{}),rejection=assert.rejects(result,/Neveljaven datum/);
 workers[0].reply({id:1,error:'Neveljaven datum'});await rejection;
 const next=call('/b',{});workers[0].reply({id:2,result:7});assert.equal(await next,7);assert.equal(workers.length,1);
});
test('native worker failures recover without leaving pending promises behind',async()=>{
 const {workers,call}=setup(),result=call('/a',{});let prevented=false;
 workers[0].onerror({preventDefault(){prevented=true}});assert.ok(prevented);
 workers[1].reply({id:1,result:3});assert.equal(await result,3);
});
function clock(){
 let now=0,next=0;const timers=new Map();
 return {setTimer(fn,delay){const id=++next;timers.set(id,{fn,at:now+delay});return id},clearTimer(id){timers.delete(id)},tick(ms){const end=now+ms;while(true){const entry=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;now=entry[1].at;timers.delete(entry[0]);entry[1].fn()}now=end},get size(){return timers.size}};
}
test('a silent worker is replaced once and its late reply cannot overwrite the real result',async()=>{
 const time=clock(),{workers,call}=setup(time),result=call('/izracun/',{from:'2028-02-01',to:'2028-02-29'});
 time.tick(20000);assert.equal(workers.length,2);assert.equal(workers[0].terminated,true);
 assert.deepEqual(workers[1].messages,workers[0].messages);
 workers[0].reply({id:1,result:'stale'});workers[1].reply({id:1,result:{working_days:20}});
 assert.deepEqual(await result,{working_days:20});assert.equal(time.size,0);
 time.tick(40000);assert.equal(workers[1].terminated,false);
});
test('two silent workers reject within forty seconds and a later user retry remains usable',async()=>{
 const time=clock(),{workers,call}=setup(time),result=call('/izracun/',{}),rejection=assert.rejects(result,/Brskalnik ni mogel pripraviti izračuna/);
 time.tick(40000);await rejection;assert.equal(workers.length,2);assert.ok(workers.every(w=>w.terminated));assert.equal(time.size,0);
 const retry=call('/izracun/',{from:'2028-02-01'});workers[2].reply({id:2,result:20});assert.equal(await retry,20);assert.equal(time.size,0);
});
test('a responsive replacement gets time to load its cold runtime',async()=>{
 const time=clock(),{workers,call}=setup(time),result=call('/izracun/',{from:'2027-04-26',to:'2027-04-27'});
 workers[0].reply({id:1,fatal:true});
 workers[1].reply({id:1,started:true});
 time.tick(35000);
 assert.equal(workers.length,2);assert.equal(workers[1].terminated,false);
 workers[1].reply({id:1,result:{days:1}});
 assert.deepEqual(await result,{days:1});assert.equal(time.size,0);
});
test('long exports retain their existing execution window without a date-calculation timeout',async()=>{
 const time=clock(),{workers,call}=setup(time),result=call('/izvozi/',{type:'annual'});
 time.tick(240000);assert.equal(workers.length,1);assert.equal(workers[0].terminated,false);
 workers[0].reply({id:1,result:{pages:12}});assert.deepEqual(await result,{pages:12});assert.equal(time.size,0);
});
