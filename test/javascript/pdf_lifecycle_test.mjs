import {test} from 'node:test';
import assert from 'node:assert/strict';
import {usingPdfDocument} from '../../cloudflare/free/pdf-lifecycle.mjs';
function fixture({loadError,cleanupError}={}) {
 let destroyed=0;
 const document={numPages:1,getPage:async()=>({})};
 const library={getDocument:options=>({promise:loadError?Promise.reject(loadError):Promise.resolve(document),destroy:async()=>{destroyed++;if(cleanupError)throw cleanupError}})};
 return {library,document,destroyed:()=>destroyed};
}
test('PDF.js6 document proxy needs no destroy method; the loading task is destroyed once',async()=>{
 const f=fixture();assert.equal(f.document.destroy,undefined);
 assert.equal(await usingPdfDocument(f.library,{data:new Uint8Array([1])},async document=>document.numPages),1);
 assert.equal(f.destroyed(),1);
});
test('invalid PDF loading releases its task without running the renderer',async()=>{
 const error=Error('invalid PDF'),f=fixture({loadError:error});let rendered=false;
 await assert.rejects(usingPdfDocument(f.library,{},()=>{rendered=true}),value=>value===error);
 assert.equal(rendered,false);assert.equal(f.destroyed(),1);
});
test('render or encoder failure still destroys the PDF worker once',async()=>{
 const error=Error('render failed'),f=fixture();
 await assert.rejects(usingPdfDocument(f.library,{},async()=>{throw error}),value=>value===error);
 assert.equal(f.destroyed(),1);
});
test('a cleanup failure cannot hide the original render failure',async()=>{
 const error=Error('render failed'),f=fixture({cleanupError:Error('cleanup failed')});
 await assert.rejects(usingPdfDocument(f.library,{},async()=>{throw error}),value=>value===error);
 assert.equal(f.destroyed(),1);
});
test('a standalone cleanup failure is reported instead of marking the export successful',async()=>{
 const error=Error('cleanup failed'),f=fixture({cleanupError:error});
 await assert.rejects(usingPdfDocument(f.library,{},async()=>1),value=>value===error);
 assert.equal(f.destroyed(),1);
});
