'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {TextEncoder}=require('node:util');
const context={window:{},globalThis:{},TextEncoder};
vm.runInNewContext(fs.readFileSync('app/assets/javascripts/family_planner_core.js','utf8'),context);
const core=context.window.K365FamilyPlannerCore;
assert.deepEqual(Array.from(core.weekDays('2026-12-28')),['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']);
assert.equal(core.mondayISO('2026-10-21'),'2026-10-19');
assert.equal(core.addDays('2028-02-28',1),'2028-02-29');
assert.equal(core.validISO('2027-02-29'),false);
const state={version:1,members:[{id:'m1',name:'Ana',color:'red'}],events:[
 {id:'e1',title:'Trening',date:'2026-10-20',time:'17:00',endTime:'18:00',kind:'event',memberId:'m1',repeat:'weekly',reminder:15,doneDates:[]},
 {id:'e2',title:'Nakup',date:'2026-10-21',time:'',endTime:'',kind:'chore',memberId:'',repeat:'none',reminder:0,doneDates:[]}
],meals:[],groceries:[]};
const week=core.expandWeek(state.events,'2026-10-19');
assert.equal(week.length,2);
assert.deepEqual(Array.from(week,item=>item.date),['2026-10-20','2026-10-21']);
assert.equal(core.expandWeek(state.events,'2026-10-26').length,1,'weekly tasks recur on the same weekday');
assert.throws(()=>core.validateState({...state,events:[{...state.events[0],endTime:'16:00'}]}),/Preverite naslov/);
assert.throws(()=>core.validateState({...state,members:Array(9).fill(state.members[0])}),/preveč podatkov/);
const valid=core.validateState(state);
assert.equal(valid.members[0].color,'red');
const ics=core.toICS(valid,new Date('2026-10-20T10:00:00.000Z'));
assert.match(ics,/TZID:Europe\/Ljubljana/);
assert.match(ics,/RRULE:FREQ=WEEKLY;BYDAY=TU/);
assert.match(ics,/TRIGGER:-PT15M/);
assert.match(ics,/SUMMARY:Trening/);
assert.match(ics,/DTSTART;VALUE=DATE:20261021/);
assert.equal(core.escapeIcs('A,B; C\\D\nE'),'A\\,B\\; C\\\\D\\nE');
const long='SUMMARY:'+('č'.repeat(80));
for(const line of core.foldIcs(long).split('\r\n'))assert.ok(Buffer.byteLength(line,'utf8')<=75,'iCalendar lines must not exceed 75 UTF-8 octets');
console.log('Family planner date, recurrence, import and iCalendar contracts passed.');
