import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMessageApi} from '../server/messages.js';
const dir=await mkdtemp(join(tmpdir(),'robo-messages-')),file=join(dir,'messages.json');
async function start(){const api=createMessageApi({file,rateLimit:50});const server=createServer((req,res)=>api(req,res,()=>{res.writeHead(404);res.end();}));await new Promise(r=>server.listen(0,'127.0.0.1',r));return {server,url:`http://127.0.0.1:${server.address().port}/api/messages`};}
let {server,url}=await start();
const post=(data,headers={})=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
try{
 assert.equal((await post({text:'   '})).status,400);
 assert.equal((await post({text:'hello'},{Origin:'https://other.example'})).status,403);
 const text='中文想法 & <script>alert(1)</script>';
 const responses=await Promise.all(Array.from({length:33},(_,i)=>post({name:'访客'+i,text})));
 assert.ok(responses.every(r=>r.status===201));
 const first=await (await fetch(url)).json();assert.equal(first.items.length,30);assert.ok(first.next);assert.equal(first.items[0].text,text);
 const second=await (await fetch(url+'?before='+first.next)).json();assert.equal(second.items.length,3);
 await new Promise(r=>server.close(r));({server,url}=await start());
 const persisted=await (await fetch(url)).json();assert.equal(persisted.items.length,30);assert.equal(persisted.items[0].id,first.items[0].id);
 console.log('PASS: public reads, concurrent writes, persistence after restart, pagination, Unicode, validation and origin checks.');
}finally{await new Promise(r=>server.close(r));await rm(file,{force:true});await rm(dir,{recursive:false}).catch(()=>{});}
