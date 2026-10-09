import {route,json,identity,sameOrigin,body,db,HttpError} from '@/lib/server';
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const b=await body(req),u=await identity(),valid=(v:unknown)=>typeof v==='string'&&/^[a-f\d-]{36}$/i.test(v);
 if(!valid(b.visitor_id)||!valid(b.session_id)||!valid(b.view_id))throw new HttpError(400,'Visite invalide.');
 const actor=u?'user:'+u.userId:'visitor:'+b.visitor_id,now=Date.now();
 // Session IDs are opaque. A different actor cannot take over another visitor's session.
 await db().prepare('INSERT INTO platform_visits(id,actor,started_at,last_seen,last_view,views,work_id,format) VALUES(?,?,?,?,?,1,?,?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen,views=platform_visits.views+CASE WHEN platform_visits.last_view!=excluded.last_view THEN 1 ELSE 0 END,last_view=excluded.last_view,work_id=excluded.work_id,format=excluded.format WHERE platform_visits.actor=excluded.actor').bind(b.session_id,actor,now,now,b.view_id,typeof b.work_id==='string'?b.work_id.slice(0,80):null,['TEXT','AUDIO','VIDEO'].includes(b.format)?b.format:null).run();return json({ok:true});
});}
