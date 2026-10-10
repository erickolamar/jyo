import {createElement as h} from 'react';
import {ImageResponse} from 'next/og';
import {publicFragment,shareOrigin} from '@/lib/shared-fragment';
import {route} from '@/lib/server';
export async function GET(req:Request,{params}:{params:Promise<{slug:string}>}){return route(async()=>{
 const slug=(await params).slug,{share,work}=await publicFragment(slug);
 const story=new URL(req.url).searchParams.get('format')==='story',width=1080,height=story?1920:1080;
 const quote=share.text||work.title;
 const image=new ImageResponse(h('div',{style:{width:'100%',height:'100%',display:'flex',flexDirection:'column',background:'#080a0f',padding:story?'110px 86px':'62px 72px',color:'#f7f1e5',border:'2px solid #c5a86a'}},
 h('div',{style:{display:'flex',flexDirection:'column',paddingBottom:36,borderBottom:'1px solid #665331'}},h('div',{style:{fontSize:story?100:70,fontWeight:700,letterSpacing:10,color:'#c5a86a'}},'JYO'),h('div',{style:{fontSize:28,marginTop:12,color:'#e1d4ba'}},'Ici, on va plus loin…')),
 h('div',{style:{display:'flex',flex:1,alignItems:'center',fontSize:story?(quote.length>300?46:58):(quote.length>300?34:44),lineHeight:1.45,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},'« '+quote+' »'),
 h('div',{style:{display:'flex',flexDirection:'column',fontSize:26,borderTop:'1px solid #665331',paddingTop:30}},h('div',{style:{color:'#c5a86a',fontWeight:700}},work.title),h('div',{style:{fontSize:23,marginTop:12}},work.author)),
 h('div',{style:{fontSize:22,marginTop:30,color:'#c5a86a'}},'Lire la suite sur JYO'),
 h('div',{style:{fontSize:18,marginTop:12,color:'#b7b5b0',overflowWrap:'anywhere'}},shareOrigin.replace('https://','')+'/j/'+slug)),{width,height,headers:{'Cache-Control':'private, no-store'}});
 // Consume here so rendering failures are handled by route(), not a broken response stream.
 return new Response(await image.arrayBuffer(),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
});}
