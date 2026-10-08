import {route,json,identity,sameOrigin,body,db,str,choice,HttpError} from '@/lib/server';
import {accessibleContent,can_access,snapshot,track} from '@/lib/jyo';
import {allowedQuoteText,normalizedQuote} from '@/lib/shared-fragment';
export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);const u=await identity(),b=await body(req),type=choice(b.share_type,['TEXT_FRAGMENT','AUDIO_FRAGMENT','VIDEO_FRAGMENT','WORK_SHARE','PROGRESS_SHARE']);
 if(!u&&type!=='TEXT_FRAGMENT')throw new HttpError(401,'Connectez-vous pour continuer.');
 const data=await snapshot(u?.userId),work=data.works.find(w=>w.id===b.work_id);if(!work)throw new HttpError(404,'Œuvre indisponible.');
 let text='',key=null,contentId=null,duration=0,start=0;
 if(type==='PROGRESS_SHARE')text=`J’ai avancé à ${Math.round((data.states.find(s=>s.work_id===work.id)?.canonical_progress||0)*100)} % dans ${work.title}.`;
 if(type.endsWith('_FRAGMENT')){
  const c=await accessibleContent(str(b.content_id,80));
  if(c.work_id!==work.id||!await can_access(u?.userId,c)||!c.sharing_allowed)throw new HttpError(403,'Le partage d’extraits doit être activé par l’auteur dans Administration → Partage.');
  contentId=c.id;
  if(type==='TEXT_FRAGMENT'){
   text=normalizedQuote(typeof b.text==='string'?b.text:'');const allowed=await allowedQuoteText(c);
   if(text.length<3||text.length>500||!allowed.includes(text))throw new HttpError(400,'Choisissez un passage autorisé, de 3 à 500 caractères.');start=allowed.indexOf(text);
  }else{
   if(c.format!==(type==='AUDIO_FRAGMENT'?'AUDIO':'VIDEO')||!c.share_media_key||c.share_duration<1||c.share_duration>30)throw new HttpError(400,'Aucun extrait média autorisé.');key=c.share_media_key;duration=c.share_duration;
  }
 }
 const creator=u?.userId||'anonymous';
 const previous=await db().prepare('SELECT public_slug FROM shares WHERE creator_user_id=? AND content_id IS ? AND share_type=? AND text_content=? AND expires_at>? LIMIT 1').bind(creator,contentId,type,text,Date.now()).first<any>();
 if(previous)return json({slug:previous.public_slug,url:'/j/'+previous.public_slug});
 const recent=await db().prepare('SELECT COUNT(*) AS n FROM shares WHERE creator_user_id=? AND created_at>?').bind(creator,Date.now()-60000).first<any>();if(recent.n>=30)throw new HttpError(429,'Patientez une minute avant de créer un nouvel extrait.');
 const id=crypto.randomUUID(),slug=crypto.randomUUID().replaceAll('-','').slice(0,18);
 await db().prepare('INSERT INTO shares(id,creator_user_id,work_id,content_id,share_type,text_content,media_key,start_position,end_position,public_slug,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,creator,work.id,contentId,type,text,key,start,type==='TEXT_FRAGMENT'?start+text.length:duration,slug,Date.now(),Date.now()+90*86400000).run();
 await track('fragment_created',u?.userId||null,work.id,contentId,{type});return json({slug,url:'/j/'+slug});
});}
