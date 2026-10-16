import {roundGuard,roundKey} from './reading-rounds';
import {db} from './server';
export function activityDay(now=Date.now()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Douala',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
export function dailyProgressStatement(userId:string,c:any,ranged:any,pct:number,now:number,round=1){return db().prepare('INSERT INTO reading_daily(user_id,work_id,day,format,gain,updated_at) SELECT ?,?,?,?,MAX(0,?-COALESCE((SELECT MAX(furthest_percentage,percentage) FROM user_progress WHERE user_id=? AND content_id=?),0))*?,? WHERE '+roundGuard+' ON CONFLICT(user_id,work_id,day,format) DO UPDATE SET gain=reading_daily.gain+excluded.gain,updated_at=excluded.updated_at').bind(userId,c.work_id,activityDay(now),['TEXT','PDF'].includes(c.format)?'TEXT':c.format,pct,userId,c.id,ranged.canonical_end-ranged.canonical_start,now,roundKey(userId,c.work_id),round);}
export async function platformStats(){
 const now=Date.now(),today=Date.parse(activityDay(now)+'T00:00:00+01:00');
 const [online,subscribers,windows,formats]=await Promise.all([
  db().prepare('SELECT COUNT(DISTINCT actor) AS n FROM platform_visits WHERE last_seen>?').bind(now-300000).first<any>(),
  db().prepare("SELECT COUNT(*) AS n FROM (SELECT user_id FROM subscriptions WHERE ends_at>? UNION SELECT substr(key,12) AS user_id FROM settings WHERE key LIKE 'membership:%' AND json_valid(value) AND json_extract(value,'$.until')>? UNION SELECT json_extract(value,'$.user_id') AS user_id FROM settings WHERE key LIKE 'membership-gift:%' AND json_valid(value) AND json_extract(value,'$.until')>? AND json_extract(value,'$.revoked_at') IS NULL)").bind(now,now,now).first<any>(),
  Promise.all([today,today-6*86400000,today-29*86400000].map(since=>db().prepare('SELECT COUNT(*) AS visits,COUNT(DISTINCT actor) AS visitors,COALESCE(SUM(views),0) AS views FROM platform_visits WHERE started_at>=?').bind(since).first<any>())),
  db().prepare("SELECT COALESCE(format,'OTHER') AS format,COUNT(*) AS visits FROM platform_visits WHERE started_at>=? GROUP BY format").bind(today-29*86400000).all<any>()
 ]);return {online:online.n,subscribers:subscribers.n,windows,formats:formats.results,updated_at:now};
}
