import type {Metadata} from 'next';
import GiftLanding from '../../gift-landing';
import {giftPreview} from '@/lib/gifts';
import {giftLabel} from '@/lib/gift-model';
import {shareOrigin} from '@/lib/shared-fragment';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{token:string}>}):Promise<Metadata>{try{const token=(await params).token,g=await giftPreview(token),title='Un cadeau vous attend — JYO',description=giftLabel(g,g.work?.title),image=shareOrigin+'/api/gifts/t/'+token+'/card?format=og';return {title,description,referrer:'no-referrer',robots:{index:false,follow:false},openGraph:{title,description,url:shareOrigin+'/g/'+token,images:[{url:image,width:1200,height:630}]},twitter:{card:'summary_large_image',title,description,images:[image]}}}catch{return {title:'Cadeau JYO',robots:{index:false,follow:false},referrer:'no-referrer'}}}
export default async function Page({params}:{params:Promise<{token:string}>}){return <GiftLanding token={(await params).token}/>}
