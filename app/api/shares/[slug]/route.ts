import {route,json,bucket,HttpError} from '@/lib/server';
import {publicFragment} from '@/lib/shared-fragment';
export async function GET(req:Request,{params}:{params:Promise<{slug:string}>}){return route(async()=>{
 const data=await publicFragment((await params).slug);
 if(new URL(req.url).searchParams.has('media')){if(!data.record.media_key)throw new HttpError(404,'Extrait indisponible.');const obj=await bucket().get(data.record.media_key);if(!obj)throw new HttpError(404,'Extrait indisponible.');const h=new Headers({'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});obj.writeHttpMetadata(h);return new Response(obj.body,{headers:h});}
 const {record,...result}=data;return json(result);
});}
