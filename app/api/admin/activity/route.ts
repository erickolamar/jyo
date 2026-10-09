import {admin,route,json} from '@/lib/server';
import {platformStats} from '@/lib/activity';
export async function GET(){return route(async()=>{await admin();return json(await platformStats())})}
