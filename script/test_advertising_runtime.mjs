import './test_display_banner.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>fs.readFileSync(new URL(p,root),'utf8');const config=JSON.parse(read('data/advertising.json')),template=read('app/views/layouts/_advertising.html.erb');
test('production keeps cookie controls without a banner runtime',()=>{const layout=read('app/views/layouts/application.html.erb');assert.match(layout,/layouts\/cookies/);assert.match(read('app/views/layouts/_cookies.html.erb'),/cookie-preferences\.mjs/);assert.doesNotMatch(layout,/advertising-config|layouts\/advertising/);assert.doesNotMatch(read('public/cookie-preferences.mjs'),/mountDisplayBanner|Adsterra/);});
