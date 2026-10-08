import {createElement as h} from 'react';
import {ImageResponse} from 'next/og';
import {publicFragment,shareOrigin} from '@/lib/shared-fragment';
import {route} from '@/lib/server';
export async function GET(req:Request,{params}:{params:Promise<{slug:string}>}){return route(async()=>{
 const slug=(await params).slug,{share,work}=await publicFragment(slug);
 const image=new ImageResponse(h('div',{style:{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#fffaf0',padding:'48px 64px',color:'#20252a',border:'12px solid #b89654'}},
 h('div',{style:{display:'flex',alignItems:'center',gap:28}},h('div',{style:{fontSize:54,fontWeight:700,letterSpacing:8,color:'#8b6d36'}},'JYO'),h('div',{style:{fontSize:24,color:'#6b5940'}},'Ici, on va plus loin...')),
 h('div',{style:{display:'flex',flex:1,alignItems:'center',fontSize:share.text.length>300?30:38,lineHeight:1.4}},'« '+(share.text||work.title)+' »'),
 h('div',{style:{display:'flex',justifyContent:'space-between',fontSize:20,gap:24}},h('div',{style:{display:'flex',flexDirection:'column',maxWidth:650}},h('div',{},work.title),h('div',{style:{color:'#76684e',fontSize:18,marginTop:8}},work.author)),h('div',{style:{color:'#76684e',fontSize:16,alignSelf:'flex-end'}},'JYO · Lire la suite')),
 h('div',{style:{fontSize:16,marginTop:20,color:'#76684e'}},shareOrigin.replace('https://','')+'/j/'+slug)),{width:1200,height:630,headers:{'Cache-Control':'private, no-store'}});
 // Consume here so rendering failures are handled by route(), not a broken response stream.
 return new Response(await image.arrayBuffer(),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
});}
