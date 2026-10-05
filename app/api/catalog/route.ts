import { db,json,route,visible } from '@/lib/server';
import { initialData } from '@/lib/initial';
export const dynamic='force-dynamic';
export async function GET(){return route(async()=>{await initialData();const works=await db().prepare(`SELECT * FROM works WHERE ${visible} ORDER BY created_at DESC`).bind(Date.now()).all();const contents=await db().prepare(`SELECT id,work_id,format,sequence,title,description,access_type,duration,status FROM contents WHERE ${visible} ORDER BY sequence`).bind(Date.now()).all();return json({works:works.results,contents:contents.results});});}
