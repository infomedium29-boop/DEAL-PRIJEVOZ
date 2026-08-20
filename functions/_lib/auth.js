const enc = new TextEncoder();
function b64url(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
async function sign(value,secret){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const sig=await crypto.subtle.sign('HMAC',key,enc.encode(value));return b64url(new Uint8Array(sig))}
export async function makeSession(secret){const ts=Date.now().toString();return `${ts}.${await sign(ts,secret)}`}
export async function isAuthed(request,env){const cookie=request.headers.get('Cookie')||'';const m=cookie.match(/(?:^|;\s*)deal_session=([^;]+)/);if(!m||!env.SESSION_SECRET)return false;const [ts,sig]=decodeURIComponent(m[1]).split('.');if(!ts||!sig||Date.now()-Number(ts)>8*60*60*1000)return false;const expected=await sign(ts,env.SESSION_SECRET);if(sig.length!==expected.length)return false;let diff=0;for(let i=0;i<sig.length;i++)diff|=sig.charCodeAt(i)^expected.charCodeAt(i);return diff===0}
export function json(data,status=200,headers={}){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store',...headers}})}
export function needEnv(env,names){const missing=names.filter(n=>!env[n]);return missing.length?`Missing environment variables: ${missing.join(', ')}`:null}
