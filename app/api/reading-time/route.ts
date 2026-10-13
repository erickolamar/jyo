import {db,route,json,identity,sameOrigin,body,str,integer,choice,HttpError} from '@/lib/server';
import {timePremium,readingBook} from '@/lib/reading-time';
import {readingDay,readingTotals,secondsAfter} from '@/lib/reading-time-model';

export async function GET(req:Request){return route(async()=>{
 const u=(await identity(true))!,q=new URL(req.url).searchParams,tz=q.get('timezone')||'Africa/Douala';try{readingDay(Date.now(),tz)}catch{throw new HttpError(400,'Fuseau horaire invalide.')}
 if(q.get('status')==='1')return json({premium:await timePremium(u.userId),goal:await db().prepare('SELECT * FROM reading_commitments WHERE user_id=?').bind(u.userId).first()});
 const now=Date.now(),since=now-32*86400000,first=readingDay(since,tz),premium=await timePremium(u.userId);
 const [slots,manual,goal,badges]=await Promise.all([
  db().prepare('SELECT minute,book_key,title,format,mask FROM reading_time_slots WHERE user_id=? AND minute>=? ORDER BY minute').bind(u.userId,Math.floor(since/60000)).all<any>(),
  db().prepare('SELECT * FROM reading_time_manual WHERE user_id=? AND day>=? ORDER BY day DESC').bind(u.userId,first).all<any>(),
  db().prepare('SELECT * FROM reading_commitments WHERE user_id=?').bind(u.userId).first<any>(),
  db().prepare('SELECT badge,earned_at FROM reading_time_badges WHERE user_id=?').bind(u.userId).all<any>()]);
 const daily=readingTotals(slots.results,manual.results,tz,q.get('book')||'',q.get('format')||'ALL'),all=readingTotals(slots.results,manual.results,tz),today=readingDay(now,tz);
 const total=all.reduce((n,d)=>n+d.automatic+d.manual,0),activeDays=all.filter(d=>d.automatic+d.manual>=300).length;
 let pace=null;if(goal&&goal.status==='ACTIVE'&&premium){const duration=(goal.period==='DAY'?1:7)*86400000,start=goal.started_at+Math.floor(Math.max(0,now-goal.started_at)/duration)*duration;const rows=readingTotals(secondsAfter(slots.results,start),manual.results.filter(m=>m.day>=readingDay(start,tz)&&m.created_at>=start),tz);const actual=rows.reduce((n,d)=>n+d.automatic+d.manual,0),target=goal.minutes*60,expected=target*Math.min(1,(now-start)/duration);pace={actual,target,expected,gap:actual-expected,start,end:start+duration}}
 if(premium){const earned=[...(total>=3600?['FIRST_HOUR']:[]),...(activeDays>=5?['FIVE_DAYS']:[]),...(pace&&pace.actual>=pace.target?['GOAL_MET']:[])];for(const badge of earned)if(!badges.results.some(b=>b.badge===badge)){await db().prepare('INSERT OR IGNORE INTO reading_time_badges(user_id,badge,earned_at) VALUES(?,?,?)').bind(u.userId,badge,now).run();badges.results.push({badge,earned_at:now})}}
 const books=[...new Map([...slots.results,...manual.results].filter(r=>r.book_key).map(r=>[r.book_key,{id:r.book_key,title:r.title}])).values()];
 return json({daily,today,books,manual:manual.results,goal,pace,premium,badges:premium?badges.results:[],timezone:tz,updated_at:now});
})}

export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const u=(await identity(true))!,b=await body(req),now=Date.now();
 if(b.action==='auto'){
  if(b.owner!==u.userId)throw new HttpError(409,'Le compte a changé. Reconnectez le compte d’origine pour synchroniser.');
  if(!Array.isArray(b.slots)||b.slots.length>120)throw new HttpError(400,'Lot de lecture invalide.');const statements=[],titles=new Map<string,string>();
  for(const row of b.slots){const minute=integer(row.minute,Math.floor((now-366*86400000)/60000),Math.floor(now/60000)),key=str(row.book_key,100),format=choice(row.format,['TEXT','AUDIO','VIDEO']);if(!titles.has(key))titles.set(key,await readingBook(u.userId,key));
   if(typeof row.mask!=='string'||!/^\d{1,19}$/.test(row.mask))throw new HttpError(400,'Temps invalide.');const mask=BigInt(row.mask);if(mask<BigInt(0)||mask>(BigInt(1)<<BigInt(60))-BigInt(1))throw new HttpError(400,'Temps invalide.');const allowed=minute===Math.floor(now/60000)?(BigInt(1)<<BigInt(Math.floor(now/1000)%60+1))-BigInt(1):(BigInt(1)<<BigInt(60))-BigInt(1);if(mask&~allowed)throw new HttpError(400,'Temps futur refusé.');
   statements.push(db().prepare('INSERT INTO reading_time_slots(user_id,minute,book_key,title,format,mask) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id,minute,book_key,format) DO UPDATE SET mask=CAST((CAST(reading_time_slots.mask AS INTEGER) | CAST(excluded.mask AS INTEGER)) AS TEXT),title=excluded.title').bind(u.userId,minute,key,titles.get(key)!,format,mask.toString()))}
  if(statements.length)await db().batch(statements);return json({ok:true});
 }
 if(b.action==='remove-manual'){await db().prepare('DELETE FROM reading_time_manual WHERE user_id=? AND id=?').bind(u.userId,str(b.id,80)).run();return json({ok:true})}
 if(!await timePremium(u.userId))throw new HttpError(403,'Cette fonction est incluse dans Premium. Vos statistiques restent disponibles.');
 if(b.action==='manual'){
  const id=str(b.id,80);if(!/^[a-f0-9-]{36}$/i.test(id))throw new HttpError(400,'Identifiant invalide.');const day=str(b.day,10),seconds=integer(b.minutes,1,1440)*60;if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day+'T12:00:00Z'))||new Date(day+'T12:00:00Z').toISOString().slice(0,10)!==day||day>readingDay(now,'Pacific/Kiritimati')||day<readingDay(now-366*86400000))throw new HttpError(400,'Date de lecture invalide.');
  const key=str(b.book_key,100),title=key?await readingBook(u.userId,key):str(b.title,180)||'Lecture hors application',format=choice(b.format||'TEXT',['TEXT','AUDIO','VIDEO']);
  const prior=await db().prepare('SELECT id FROM reading_time_manual WHERE user_id=? AND id=?').bind(u.userId,id).first();if(prior)return json({ok:true});
  const result=await db().prepare('INSERT OR IGNORE INTO reading_time_manual(user_id,id,day,seconds,book_key,title,format,created_at) SELECT ?,?,?,?,?,?,?,? WHERE COALESCE((SELECT SUM(seconds) FROM reading_time_manual WHERE user_id=? AND day=?),0)+?<=86400').bind(u.userId,id,day,seconds,key,title,format,now,u.userId,day,seconds).run();if(!result.meta.changes)throw new HttpError(400,'Le cumul saisi dépasse 24 heures pour cette journée.');return json({ok:true});
 }
 if(b.action==='commitment'){
  const minutes=integer(b.minutes,5,10080),period=choice(b.period,['DAY','WEEK']);if(period==='DAY'&&minutes>1440)throw new HttpError(400,'Maximum 24 heures par jour.');const status=choice(b.status||'ACTIVE',['ACTIVE','PAUSED','STOPPED']);
  const old=await db().prepare('SELECT * FROM reading_commitments WHERE user_id=?').bind(u.userId).first<any>();const start=b.restart||!old||old.status!=='ACTIVE'&&status==='ACTIVE'?now:old.started_at;
  await db().prepare('INSERT INTO reading_commitments(user_id,minutes,period,status,started_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET minutes=excluded.minutes,period=excluded.period,status=excluded.status,started_at=excluded.started_at,updated_at=excluded.updated_at').bind(u.userId,minutes,period,status,start,now).run();return json({ok:true});
 }
 throw new HttpError(400,'Action inconnue.');
})}
