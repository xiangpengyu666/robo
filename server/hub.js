import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';

// Private review inbox. No anonymous list/read/publish endpoint.
export function createHubApi({directory=resolve(process.env.ROBO_DATA_DIR||'data','hub-submissions')}={}){
 const limits=new Map();
 return async(req,res,next)=>{
  if(new URL(req.url,'http://localhost').pathname!=='/api/hub/submissions')return next();
  const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  if(req.method!=='POST'){res.setHeader('Allow','POST');return send(405,{error:'method'});}
  try{
   if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return send(403,{error:'origin'});
   if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'type'});
   let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>24000)return send(413,{error:'size'});chunks.push(chunk);}
   let body;try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return send(400,{error:'invalid'});}
   if(!body||typeof body!=='object')return send(400,{error:'invalid'});
   const fields={name:80,author:60,email:200,url:1000,compatibility:120,license:120,description:3000};const item={};
   for(const [key,max] of Object.entries(fields)){if(typeof body[key]!=='string'||!body[key].trim()||body[key].length>max)return send(400,{error:'invalid'});item[key]=body[key].trim();}
   if(!['robot','3d','software','plugin'].includes(body.category)||body.permission!==true||!/^\S+@\S+\.\S+$/.test(item.email))return send(400,{error:'invalid'});
   let url;try{url=new URL(item.url);}catch{return send(400,{error:'url'});}
   if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return send(400,{error:'url'});
   const now=Date.now();for(const [key,value] of limits)if(now-value.start>60000)limits.delete(key);
   const ip=req.socket.remoteAddress,limit=limits.get(ip)||{start:now,count:0};if(limit.count>=3)return send(429,{error:'rate'});limit.count++;limits.set(ip,limit);
   item.id=randomUUID();item.category=body.category;item.status='pending';item.createdAt=new Date().toISOString();
   await mkdir(directory,{recursive:true});await writeFile(resolve(directory,item.id+'.json'),JSON.stringify(item,null,2),{encoding:'utf8',flag:'wx'});
   return send(201,{id:item.id,status:'pending'});
  }catch(error){console.error('Hub submission:',error.message);if(!res.headersSent)send(500,{error:'storage'});}
 };
}
