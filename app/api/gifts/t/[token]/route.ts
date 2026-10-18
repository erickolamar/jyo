import {json,route,identity,sameOrigin,body,HttpError} from '@/lib/server';
import {giftPreview,claimGift,thankGift} from '@/lib/gifts';
import {track} from '@/lib/jyo';
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){return route(async()=>{const u=await identity(),token=(await params).token;return json(await giftPreview(token,u?.userId))})}
export async function POST(req:Request,{params}:{params:Promise<{token:string}>}){return route(async()=>{sameOrigin(req);const u=(await identity(true))!,b=await body(req),token=(await params).token;if(b.action==='claim')return json(await claimGift(token,u.userId));if(b.action==='thank')return json(await thankGift(token,u.userId,b.message));if(b.action==='thank-start'){await giftPreview(token,u.userId);await track('gift_thank_you_started',u.userId,null);return json({ok:true})}throw new HttpError(400,'Action inconnue.')})}
