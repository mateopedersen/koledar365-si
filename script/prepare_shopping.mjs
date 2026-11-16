import fs from 'node:fs/promises';
import path from 'node:path';
import c from '../data/shopping-guides.json' with {type:'json'};
import {render,discovery,writeCalendars} from './shopping-guides/render.mjs';
const root=path.resolve(import.meta.dirname,'..');
await writeCalendars(c,path.join(root,'public/shopping'));
await fs.mkdir(path.join(root,'data/shopping-html'),{recursive:true});
for(const p of c.pages)await fs.writeFile(path.join(root,'data/shopping-html',p.slug+'.html'),render(c,p));
await fs.writeFile(path.join(root,'data/shopping-html/discovery.html'),discovery(c));
