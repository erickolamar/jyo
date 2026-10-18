import {createElement as h} from 'react';
import {ImageResponse} from 'next/og';
import {shareFont} from './share-fonts';
import {bucket} from './server';
import {shareOrigin} from './shared-fragment';
import {giftStyles,giftLabel} from './gift-model';
async function coverData(path:string){
 if(/^\/api\/covers\/[a-zA-Z0-9-]+$/.test(path)){const f=await bucket().get(path.split('/').pop()!);if(f&&f.size<=8*1024*1024){const data=new Uint8Array(await f.arrayBuffer());let s='';for(let i=0;i<data.length;i+=32768)s+=String.fromCharCode(...data.subarray(i,i+32768));const mime=data[0]===137&&data[1]===80?'image/png':data[0]===82&&data[8]===87?'image/webp':f.httpMetadata?.contentType||'image/jpeg';return 'data:'+mime+';base64,'+btoa(s)}}
 // Only local public artwork may be fetched; never follow a supplied URL to another host.
 if(/^\/[a-zA-Z0-9/_-]+\.(png|jpg|jpeg|webp)$/.test(path))return shareOrigin+path;
 return '';
}
export async function renderGiftCard(g:any,secret:string,format:string,requestedStyle?:string){
 const story=format==='story',og=format==='og',width=og?1200:1080,height=og?630:story?1920:1080,style=giftStyles.includes(requestedStyle as any)?requestedStyle:g.card_style||'elegant';
 const dark=style==='mystery',bg=dark?'#080A0F':style==='warm'?'#f5e7d0':style==='celebration'?'#fff9e8':style==='minimal'?'#f4f3ef':'#f6f1e7',ink=dark?'#fff5dd':'#29241e',gold=dark?'#d5b574':style==='warm'?'#96714d':'#997738';
 const workGift=!g.gift_type||g.gift_type==='WORK',cover=workGift&&g.work?await coverData(g.work.cover):'',title=giftLabel({...g,gift_type:g.gift_type||'WORK'},g.work?.title),message=g.message||'Une belle découverte vous attend.',url=shareOrigin+'/g/'+secret;
 const coverWidth=og?210:story?(style==='minimal'&&message.length<300?560:470):message.length>300?200:style==='minimal'?330:250,coverHeight=Math.round(coverWidth*1.45);
 const coverElement=h('div',{style:{display:'flex',position:'relative',width:coverWidth,height:coverHeight,flexShrink:0,transform:dark?'rotate(-4deg)':'rotate(0deg)',boxShadow:'8px 12px 30px #00000030',background:'#15171c',borderLeft:'8px solid #ffffff24'}},cover?h('img',{src:cover,width:coverWidth,height:coverHeight,style:{objectFit:'cover'}}):h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',width:'100%',color:'#dfbc77',fontSize:og?42:62}},'JYO',h('span',{style:{fontSize:20,marginTop:20}},g.gift_type==='SUBSCRIPTION'?'Abonnement '+(g.plan_name||'JYO'):g.work?g.work.title:g.days+' jours')),
 h('div',{style:{position:'absolute',left:'45%',top:0,width:style==='celebration'?14:4,height:'100%',background:gold,opacity:.88}}),h('div',{style:{position:'absolute',left:0,top:'67%',width:'100%',height:style==='celebration'?14:4,background:gold,opacity:.88}}),h('div',{style:{position:'absolute',left:'39%',top:'61%',width:50,height:34,border:'3px solid '+gold,borderRadius:40,transform:'rotate(-20deg)'}}));
 const logo=h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',color:ink}},h('div',{style:{fontSize:og?48:story?86:58,letterSpacing:7,color:gold}},'JYO'),h('div',{style:{fontSize:og?18:story?26:22,marginTop:4}},'Ici, on va plus loin…'));
 const text=h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',flex:1,justifyContent:'center',padding:og?'0 35px':'0 20px',gap:story?24:12}},h('div',{style:{fontSize:og?32:story?44:30,fontWeight:700}},title),g.recipient_name?h('div',{style:{fontSize:og?22:story?32:24,color:gold}},'Pour '+g.recipient_name):null,h('div',{style:{fontSize:og?(message.length>300?16:19):story?(message.length>300?27:34):(message.length>300?18:26),lineHeight:1.45,whiteSpace:'pre-wrap',overflowWrap:'anywhere',...(style==='warm'?{background:'#fffaf0',padding:og?12:22,border:'1px solid #d9c5a5',borderRadius:4}:{} )}},message),h('div',{style:{fontSize:og?19:24,color:gold}},'Offert par '+g.sender_name));
 const root=h('div',{style:{display:'flex',position:'relative',flexDirection:'column',alignItems:'center',width:'100%',height:'100%',background:bg,color:ink,fontFamily:'JyoGift',padding:og?'25px 45px':story?'70px 70px':'35px 60px',border:'2px solid '+gold,overflow:'hidden'}},
 cover?h('img',{src:cover,style:{position:'absolute',top:0,left:0,width:'100%',height:'100%',objectFit:'cover',opacity:dark?.12:.045}}):null,
 style==='celebration'?h('div',{style:{position:'absolute',top:25,left:30,right:30,height:20,display:'flex',justifyContent:'space-between'}},...Array.from({length:7},(_,i)=>h('div',{key:i,style:{width:7,height:i%2?15:7,background:gold,opacity:.45,transform:'rotate('+i*15+'deg)'}}))):null,
 logo,h('div',{style:{display:'flex',flexDirection:og?'row':'column',alignItems:'center',justifyContent:'center',width:'100%',flex:1,gap:story?48:og?10:22,paddingTop:og?16:25,paddingBottom:og?16:25}},coverElement,text),
 h('div',{style:{display:'flex',padding:og?'12px 36px':'20px 40px',background:dark?'#d5b574':'#28251f',color:dark?'#17130c':'#fff6e5',fontSize:og?18:24,borderRadius:8}},'OUVRIR MON CADEAU'),
 h('div',{style:{fontSize:og?11:14,marginTop:16,overflowWrap:'anywhere',textAlign:'center',maxWidth:'100%'}},url));
 const response=new ImageResponse(root,{width,height,fonts:[{name:'JyoGift',data:shareFont('serif'),weight:400,style:'normal'}]});return new Response(await response.arrayBuffer(),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});
}
