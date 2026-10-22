import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRubyClient} from '../../cloudflare/free/ruby-client.mjs';
function setup(){
 const workers=[];
 const call=createRubyClient(()=>{
  const worker={messages:[],terminated:false,postMessage(message){this.messages.push(message)},terminate(){this.terminated=true},reply(data){this.onmessage({data})}};
  workers.push(worker);return worker;
 });
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
