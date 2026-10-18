import {route,HttpError} from '@/lib/server';
import {giftPreview} from '@/lib/gifts';
import {renderGiftCard} from '@/lib/gift-card';
export async function GET(req:Request,{params}:{params:Promise<{token:string}>}){return route(async()=>{const secret=(await params).token,g=await giftPreview(secret);if(!g.available||g.status==='REVOKED'||g.status==='EXPIRED')throw new HttpError(410,'Ce cadeau n’est plus valide.');const q=new URL(req.url).searchParams;return renderGiftCard(g,secret,q.get('format')||'square',q.get('style')||undefined)})}
