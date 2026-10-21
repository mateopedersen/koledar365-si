'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync('site/druzinski-planer/index.html','utf8');
assert.match(html,/data-family-planner/,'the published page should render the family workspace');
assert.match(html,/family-planner-page/,'the published page should receive its family theme');
const block=html.match(/<script[^>]*id="k365-static-config"[^>]*>([^<]*)<\/script>/);
assert.ok(block,'the published page should include its static asset configuration');
const config=JSON.parse(block[1]);
const scripts=config.scripts||[];
const core=scripts.findIndex(source=>source.includes('family_planner_core-'));
const app=scripts.findIndex(source=>source.includes('family_planner-'));
assert.ok(core>=0&&app>core,'family planner assets should load in dependency order');
for(const source of [scripts[core],scripts[app]]){
 const asset=path.join('site',source.split('?')[0].replace(/^\//,''));
 assert.ok(fs.existsSync(asset),'published JavaScript asset should exist: '+source);
}
const styleLinks=[...html.matchAll(/<link[^>]+href="(\/assets\/web-[^"]+\.css)"/g)].map(match=>match[1]);
assert.ok(styleLinks.length,'the page should link its combined stylesheet');
assert.ok(styleLinks.some(source=>fs.readFileSync(path.join('site',source.slice(1)),'utf8').includes('.family-hero')),'the published page should include the family-specific visual theme');
console.log('Published family planner markup, assets and theme passed.');
