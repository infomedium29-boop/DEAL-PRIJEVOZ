import { isAuthed,json } from '../_lib/auth.js';
export async function onRequestGet({request,env}){
  if(!await isAuthed(request,env))return json({error:'unauthorized'},401);
  if(!env.DEAL_DATA)return json({inquiries:[],storage:false});
  try{
    const listed=await env.DEAL_DATA.list({prefix:'inq:',limit:100});
    const keys=listed.keys.sort((a,b)=>b.name.localeCompare(a.name));
    const items=[];
    for(const k of keys){const v=await env.DEAL_DATA.get(k.name,'json');if(v)items.push(v)}
    return json({inquiries:items,storage:true});
  }catch(e){return json({error:'inquiry_read_failed'},500)}
}
