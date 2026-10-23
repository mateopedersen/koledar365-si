// Parse rather than regex-rewrite CSS. Keep all selectors, print and interactive states.
import fs from 'node:fs';
import {transform} from 'lightningcss';
const code=fs.readFileSync(0);
const result=transform({filename:'publication.css',code,minify:true,sourceMap:false,errorRecovery:false});
if(result.warnings.length)throw new Error(JSON.stringify(result.warnings));
process.stdout.write(result.code);
