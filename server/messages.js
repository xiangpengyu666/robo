import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

export function createMessageApi({file=resolve(process.env.ROBO_DATA_DIR||'data','messages.json'),rateLimit=5}={}){
  let queue=Promise.resolve();const limits=new Map();
  async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return [];throw e;}}
  const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  return async(req,res,next)=>{
    const url=new URL(req.url,'http://localhost');if(url.pathname!=='/api/messages')return next();
    try{
      if(req.method==='GET'){
        const all=(await read()).reverse();const before=url.searchParams.get('before');
        const start=before?all.findIndex(m=>m.id===before)+1:0;
        const items=all.slice(start,start+30);
        return send(res,200,{items,next:start+30<all.length?items.at(-1)?.id:null});
      }
      if(req.method!=='POST'){res.setHeader('Allow','GET, POST');return send(res,405,{error:'method'});}
      if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(res,403,{error:'origin'});
      if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'type'});
      const chunks=[];let bytes=0;
      for await(const chunk of req){bytes+=chunk.length;if(bytes>12000)return send(res,413,{error:'size'});chunks.push(chunk);}
      let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(res,400,{error:'invalid'});}
      const text=typeof body?.text==='string'?body.text.trim():'';
      const name=typeof body?.name==='string'?body.name.trim():'';
      if(!text||text.length>2000||name.length>40)return send(res,400,{error:'invalid'});
      const ip=req.socket.remoteAddress,now=Date.now();
      for(const [key,value] of limits)if(now-value.start>60000)limits.delete(key);
      const entry=limits.get(ip)||{start:now,count:0};
      if(entry.count>=rateLimit){res.setHeader('Retry-After','60');return send(res,429,{error:'rate'});}
      entry.count++;limits.set(ip,entry);
      const item={id:randomUUID(),name,text,createdAt:new Date().toISOString()};
      const save=queue.then(async()=>{const all=await read();all.push(item);await mkdir(dirname(file),{recursive:true});const temp=file+'.tmp';await writeFile(temp,JSON.stringify(all),'utf8');await rename(temp,file);});
      queue=save.catch(()=>{});await save;
      return send(res,201,{item});
    }catch(error){console.error('Message API:',error.message);if(!res.headersSent)send(res,500,{error:'storage'});}
  };
}
