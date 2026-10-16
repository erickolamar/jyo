import {db,HttpError} from './server';
import {setting} from './editorial';
export const roundKey=(user:string,work:string)=>'reading-round:'+user+':'+work;
export const roundGuard="COALESCE((SELECT json_extract(value,'$.round') FROM settings WHERE key=?),1)=?";
export async function readingRound(user:string|undefined,work:string){return user?await setting(roundKey(user,work),{round:1}):{round:1}}
export function assertRound(value:unknown,current:number){if(Number(value??1)!==current)throw new HttpError(409,'Une nouvelle lecture a commencé. Rouvrez le livre pour retrouver votre progression actuelle.');}
