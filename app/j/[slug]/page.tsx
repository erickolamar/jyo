import type {Metadata} from 'next';
import Jyo from '../../jyo-ui';
import {publicFragment,shareOrigin} from '@/lib/shared-fragment';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 try{const slug=(await params).slug,{share,work}=await publicFragment(slug),url=shareOrigin+'/j/'+slug,image=shareOrigin+'/api/shares/'+slug+'/card',description=(share.text||work.title)+' — JYO · Ici, on va plus loin...';return {title:work.title+' — Extrait JYO',description,openGraph:{type:'article',title:work.title+' — JYO',description,url,siteName:'JYO',images:[{url:image,width:1080,height:1080,alt:'Extrait de '+work.title+' — JYO'}]},twitter:{card:'summary_large_image',title:work.title+' — JYO',description,images:[image]},robots:{index:false,follow:true}}}catch{return {title:'Extrait indisponible — JYO',robots:{index:false}}}
}
export default function Page(){return <Jyo/>;}
