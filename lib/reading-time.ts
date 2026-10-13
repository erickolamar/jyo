import {db,HttpError} from './server';
import {membership,setting} from './editorial';
export async function timePremium(user:string){return (await membership(user)).plan==='PREMIUM'}
export async function legacyGoal(user:string,work:string){return db().prepare("SELECT g.*,l.until AS legacy_until FROM user_goals g JOIN reading_legacy_goals l ON l.id=g.id WHERE g.user_id=? AND g.work_id=? AND l.until>? AND g.status IN ('ACTIVE','PAUSED')").bind(user,work,Date.now()).first<any>()}
export async function readingBook(user:string,key:string){
 if(key.startsWith('private:')){const id=key.slice(8),book=await setting('personal:'+user+':'+id,null);if(book?.status==='ready')return book.title}
 if(key.startsWith('work:')){const row=await db().prepare("SELECT title FROM works WHERE id=? AND (status='PUBLISHED' OR (status='SCHEDULED' AND publish_at<=?))").bind(key.slice(5),Date.now()).first<any>();if(row)return row.title}
 throw new HttpError(404,'Livre indisponible.');
}

export async function readingGoal(user:string,goal:any){if(!goal)return null;const premium=await timePremium(user),legacy=await legacyGoal(user,goal.work_id);return {...goal,legacy:!premium&&!!legacy,can_manage:premium||!!legacy,status:!premium&&!legacy&&['ACTIVE','PAUSED'].includes(goal.status)?'EXPIRED':goal.status}}
