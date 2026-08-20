import { json } from './auth.js';
const api='https://api.github.com';
const headers=env=>({'authorization':`Bearer ${env.GITHUB_TOKEN}`,'accept':'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'deal-cms'});
const repo=env=>`${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
export async function getFile(env,filePath){const ref=encodeURIComponent(env.GITHUB_BRANCH||'main');const r=await fetch(`${api}/repos/${repo(env)}/contents/${filePath}?ref=${ref}`,{headers:headers(env)});if(!r.ok){const t=await r.text();throw new Error(`github_get_${r.status}:${t.slice(0,180)}`)}return r.json()}
export async function putFile(env,filePath,contentBase64,message,sha){const body={message,content:contentBase64,branch:env.GITHUB_BRANCH||'main'};if(sha)body.sha=sha;const r=await fetch(`${api}/repos/${repo(env)}/contents/${filePath}`,{method:'PUT',headers:{...headers(env),'content-type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const t=await r.text();throw new Error(`github_put_${r.status}:${t.slice(0,220)}`)}return r.json()}
export function bytesToBase64(bytes){let s='';const chunk=0x8000;for(let i=0;i<bytes.length;i+=chunk)s+=String.fromCharCode(...bytes.subarray(i,i+chunk));return btoa(s)}
export function textToBase64(text){return bytesToBase64(new TextEncoder().encode(text))}
export function base64ToText(b64){const bin=atob(b64.replace(/\n/g,''));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
export async function listDir(env,filePath){const ref=encodeURIComponent(env.GITHUB_BRANCH||'main');const r=await fetch(`${api}/repos/${repo(env)}/contents/${filePath}?ref=${ref}`,{headers:headers(env)});if(r.status===404)return[];if(!r.ok)throw new Error(`github_list_${r.status}`);return r.json()}
