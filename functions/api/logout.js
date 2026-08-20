import { json } from '../_lib/auth.js';
export function onRequestPost(){return json({ok:true},200,{'set-cookie':'deal_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'})}
