import test from 'node:test';
import assert from 'node:assert/strict';
import {readChecklist} from '../../public/topics/experience.mjs';

test('preparation accepts exactly three booleans and rejects corrupt or unrelated stored data',()=>{
 for(const value of ['bad','null','{}','[true,false]','[1,0,true]','[true,true,true,true]'])assert.deepEqual(readChecklist(value),[false,false,false]);
 assert.deepEqual(readChecklist('[true,false,true]'),[true,false,true]);
 assert.deepEqual(readChecklist('[false,false,false]'),[false,false,false]);
});
