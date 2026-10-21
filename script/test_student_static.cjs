'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync('site/solski-urnik/index.html','utf8');
assert.match(html,/data-student-timetable/,'the published page should render the student planner');
assert.match(html,/student-timetable-page/,'the published page should receive the dedicated theme');
assert.match(html,/data-task-form/,'the published page should contain the assignment tracker');
assert.equal((html.match(/data-personal-preview=/g)||[]).length,15,'all fifteen personal print previews should remain available');
assert.equal((html.match(/data-export="[^"]+" data-format="pdf"/g)||[]).length,15,'all fifteen PDF actions should remain available');
assert.equal((html.match(/data-export="[^"]+" data-format="webp"/g)||[]).length,15,'all fifteen WebP actions should remain available');
assert.match(html,/solski-koledar-za-osnovne-sole/,'the current primary-school calendar source should be present');

const configTag=html.match(/<script[^>]*id="k365-static-config"[^>]*>([^<]*)<\/script>/);
assert.ok(configTag,'the static page should include its asset configuration');
const config=JSON.parse(configTag[1]);
const scripts=config.scripts||[];
const core=scripts.findIndex(source=>source.includes('student_timetable_core-'));
const app=scripts.findIndex(source=>source.includes('student_timetable-'));
assert.ok(core>=0&&app>core,'student planner scripts should load in dependency order');
for(const source of [scripts[core],scripts[app]]){
 const asset=path.join('site',source.split('?')[0].replace(/^\//,''));
 assert.ok(fs.existsSync(asset),'published student planner JavaScript should exist: '+source);
}
const styleLinks=[...html.matchAll(/<link[^>]+href="(\/assets\/web-[^"]+\.css)"/g)].map(match=>match[1]);
const studentStyles=styleLinks.map(source=>fs.readFileSync(path.join('site',source.slice(1)),'utf8')).find(style=>style.includes('.student-workspace'));
assert.ok(studentStyles,'the published page should include its complete student planner theme');
assert.match(studentStyles,/@media\s*\(max-width:\s*760px\)/,'the published student planner should include narrow-screen layout rules');
console.log('Published student planner markup, all 15 print pairs, scripts and responsive theme passed.');
