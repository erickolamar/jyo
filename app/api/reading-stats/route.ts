import {route,json,identity,db,HttpError} from '@/lib/server';
import {snapshot} from '@/lib/jyo';
export async function GET(req:Request){return route(async()=>{
 const u=(await identity(true))!,workId=new URL(req.url).searchParams.get('work_id'),data=await snapshot(u.userId),state=data.states.find(s=>s.work_id===workId);if(!state)throw new HttpError(404,'Œuvre indisponible.');
 const daily=(await db().prepare('SELECT day,format,gain FROM reading_daily WHERE user_id=? AND work_id=? ORDER BY day DESC LIMIT 270').bind(u.userId,workId).all()).results;
 return json({state,daily,timezone:'Africa/Douala',progress:data.progress.filter(p=>p.work_id===workId)});
});}
