import { json } from '../_lib/auth.js';
export async function onRequestPost({request,env}){
  try{
    const body=await request.json();
    const clean={name:String(body.name||'').slice(0,120),email:String(body.email||'').slice(0,180),phone:String(body.phone||'').slice(0,80),service:String(body.service||'').slice(0,80),message:String(body.message||'').slice(0,4000),locale:String(body.locale||'hr').slice(0,8),page:String(body.page||'').slice(0,500),createdAt:new Date().toISOString()};
    if(!clean.name||!clean.email||!clean.message)return json({error:'required_fields'},400);
    let delivered=false;
    if(env.WEB3FORMS_KEY){
      const r=await fetch('https://api.web3forms.com/submit',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({access_key:env.WEB3FORMS_KEY,subject:`DEAL upit: ${clean.service||'web'}`,from_name:'DEAL web',name:clean.name,email:clean.email,phone:clean.phone,message:clean.message,page:clean.page})});
      const out=await r.json().catch(()=>({})); delivered=!!out.success;
    }
    // Optional Cloudflare KV inbox. Personal data never goes into the public GitHub repository.
    if(env.DEAL_DATA){const id=`inq:${Date.now()}:${crypto.randomUUID()}`;await env.DEAL_DATA.put(id,JSON.stringify(clean),{expirationTtl:60*60*24*180});}
    if(!delivered && !env.DEAL_DATA)return json({error:'inquiry_service_not_configured'},503);
    return json({ok:true});
  }catch(e){return json({error:'send_failed'},500)}
}
