import {route,json,identity} from '@/lib/server';
import {snapshot} from '@/lib/jyo';
export async function GET(req:Request){return route(async()=>{const user=await identity();const data=await snapshot(user?.userId);const workId=new URL(req.url).searchParams.get('work_id');return json(workId?data.states.find(s=>s.work_id===workId)?.action||data.action:data.action);});}
