import { isAuthed,json,needEnv,sameOrigin } from '../_lib/auth.js';
import { getFile,putFile,base64ToText,textToBase64 } from '../_lib/github.js';
const required=['GITHUB_TOKEN','GITHUB_OWNER','GITHUB_REPO'];
const slugRe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function validate(content){
  if(!content||typeof content!=='object') return 'invalid_content';
  for(const k of ['settings','locales','copy','divisions','items','fleet']) if(!content[k]) return `missing_${k}`;
  const localeKeys=Object.keys(content.locales||{});
  if(!localeKeys.length||localeKeys.length>10) return 'invalid_locales';
  for(const l of localeKeys) if(!content.copy?.[l]) return `missing_copy_${l}`;
  const divisionIds=new Set();
  for(const d of content.divisions||[]){
    if(!d?.id||divisionIds.has(d.id)) return 'invalid_divisions'; divisionIds.add(d.id);
    if(!d.path||!slugRe.test(d.path)) return `invalid_division_path_${d.id}`;
  }
  for(const [type,arr] of Object.entries(content.items||{})){
    if(!Array.isArray(arr)||arr.length>250) return `invalid_items_${type}`;
    const slugs=new Set();
    for(const item of arr){
      if(!item?.slug||!slugRe.test(item.slug)||slugs.has(item.slug)) return `invalid_or_duplicate_slug_${type}`;
      slugs.add(item.slug);
    }
  }
  const pageSlugs=new Set();
  for(const page of content.pages||[]){
    if(!page?.slug||!slugRe.test(page.slug)||pageSlugs.has(page.slug)) return 'invalid_or_duplicate_page_slug';
    pageSlugs.add(page.slug);
  }
  return null;
}

export async function onRequestGet({request,env}){
  if(!await isAuthed(request,env))return json({error:'unauthorized'},401);
  const miss=needEnv(env,required);if(miss)return json({error:miss},503);
  try{const file=await getFile(env,'content/content.json');return json({content:JSON.parse(base64ToText(file.content)),sha:file.sha})}
  catch(e){return json({error:e.message},500)}
}

export async function onRequestPost({request,env}){
  if(!sameOrigin(request))return json({error:'bad_origin'},403);
  if(!await isAuthed(request,env))return json({error:'unauthorized'},401);
  const miss=needEnv(env,required);if(miss)return json({error:miss},503);
  try{
    const body=await request.json();
    if(!body.content)return json({error:'missing_content'},400);
    const invalid=validate(body.content);if(invalid)return json({error:invalid},400);
    const current=await getFile(env,'content/content.json');
    if(body.sha&&body.sha!==current.sha)return json({error:'content_changed',message:'Sadržaj je u međuvremenu promijenjen. Osvježite CMS prije spremanja.',latestSha:current.sha},409);
    const text=JSON.stringify(body.content,null,2)+'\n';
    if(text.length>1800000)return json({error:'content_too_large'},413);
    const saved=await putFile(env,'content/content.json',textToBase64(text),'CMS: update DEAL content',current.sha);
    return json({ok:true,sha:saved?.content?.sha||null});
  }catch(e){return json({error:e.message},500)}
}
