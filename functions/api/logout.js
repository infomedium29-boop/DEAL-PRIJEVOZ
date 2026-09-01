import { json,sameOrigin } from '../_lib/auth.js';
export function onRequestPost({request}){if(!sameOrigin(request))return json({error:'bad_origin'},403);return json({ok:true},200,{'set-cookie':'deal_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'})}
