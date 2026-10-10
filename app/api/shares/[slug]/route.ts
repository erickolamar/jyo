import {route,json,bucket,HttpError,identity} from '@/lib/server';
import {can_access} from '@/lib/jyo';
import {publicFragment} from '@/lib/shared-fragment';
export async function GET(req:Request,{params}:{params:Promise<{slug:string}>}){return route(async()=>{
 const data=await publicFragment((await params).slug);
 if(new URL(req.url).searchParams.has('media')){if(!data.record.media_key)throw new HttpError(404,'Extrait indisponible.');const obj=await bucket().get(data.record.media_key);if(!obj)throw new HttpError(404,'Extrait indisponible.');const h=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});obj.writeHttpMetadata(h);return new Response(obj.body,{headers:h});}
 const {record,...result}=data;const u=await identity();if(u&&record.content_id&&result.share.share_type==='TEXT_FRAGMENT'&&await can_access(u.userId,{id:record.content_id,work_id:result.work.id,access_type:result.direct_read?'FREE':'PREMIUM'}))result.direct_read=true;return json({...result,payment_url:record.content_id?'/paywall/'+record.content_id+'?fragment='+encodeURIComponent(record.public_slug):null});
});}
