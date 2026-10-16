import {route,json,identity,sameOrigin,body,db,HttpError,str} from '@/lib/server';
import {published,workProgress,contentUrl} from '@/lib/jyo';
import {readingRound,roundGuard,roundKey,assertRound} from '@/lib/reading-rounds';
export async function GET(req:Request){return route(async()=>{const u=(await identity(true))!,work=str(new URL(req.url).searchParams.get('work'),100),prefix='reading-history:'+u.userId+':'+work+':';const rows=await db().prepare('SELECT value FROM settings WHERE substr(key,1,?)=? ORDER BY key').bind(prefix.length,prefix).all<any>();return json({...(await readingRound(u.userId,work)),history:rows.results.map(r=>{const h=JSON.parse(r.value);return {round:h.round,finished_at:h.finished_at}})});});}
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const u=(await identity(true))!,b=await body(req),work=str(b.work_id,100),{works,contents}=await published();if(!works.some(w=>w.id===work))throw new HttpError(404,'Œuvre indisponible.');const current=await readingRound(u.userId,work),round=Number(current.round)||1;assertRound(b.round,round);
 const progress=(await db().prepare('SELECT * FROM user_progress WHERE user_id=? AND work_id=?').bind(u.userId,work).all<any>()).results;if(workProgress(work,contents,progress)<.999)throw new HttpError(409,'Terminez cette lecture avant d’en commencer une nouvelle.');
 const key=roundKey(u.userId,work),now=Date.now();
 // Archive inside the same transaction as the reset: a late save is either included or rejected by the round guard.
 const fields=['content_id','work_id','format_id','position','percentage','furthest_percentage','completed','updated_at','canonical_progress','page_number','scroll_ratio','text_anchor','character_offset','timestamp_seconds','source_version','automatic_position','manual_resume_position'];
 const archived="json_object("+fields.map(f=>"'"+f+"',"+f).join(',')+")";
 const results=await db().batch([
  db().prepare(`INSERT OR IGNORE INTO settings(key,value) SELECT ?,json_object('round',?,'finished_at',?,'progress',json((SELECT COALESCE(json_group_array(${archived}),'[]') FROM user_progress WHERE user_id=? AND work_id=?))) WHERE ${roundGuard}`).bind('reading-history:'+u.userId+':'+work+':'+round,round,now,u.userId,work,key,round),
  db().prepare(`DELETE FROM user_progress WHERE user_id=? AND work_id=? AND ${roundGuard}`).bind(u.userId,work,key,round),
  db().prepare(`UPDATE user_goals SET status='CANCELLED' WHERE user_id=? AND work_id=? AND ${roundGuard}`).bind(u.userId,work,key,round),
  db().prepare(`INSERT INTO settings(key,value) SELECT ?,? WHERE ${roundGuard} ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind(key,JSON.stringify({round:round+1,started_at:now}),key,round)
 ]);if(!results[3].meta.changes)throw new HttpError(409,'Cette nouvelle lecture a déjà été créée. Rechargez la bibliothèque.');
 const first=contents.find(c=>c.work_id===work&&['TEXT','PDF'].includes(c.format))||contents.find(c=>c.work_id===work);return json({round:round+1,return_to:first?contentUrl(first):'/library'});
});}
