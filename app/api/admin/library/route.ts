import {admin,db,bucket,route,json,sameOrigin,str,integer,choice,HttpError,publicSettings} from '@/lib/server';
import {validateBook,bookAssets,blockText} from '@/lib/book-model';
import {readingDocument} from '@/lib/book-server';

export async function POST(req:Request){return route(async()=>{
 sameOrigin(req);await admin();const raw=await req.text();if(raw.length>10_000_000)throw new HttpError(413,'Document trop volumineux.');let b;try{b=JSON.parse(raw)}catch{throw new HttpError(400,'Données invalides.')}const now=Date.now();
 if(b.action==='work'){
  const id=str(b.id,80)||crypto.randomUUID(),old=await db().prepare('SELECT * FROM works WHERE id=?').bind(id).first<any>();
  const title=str(b.title,200),author=str(b.author,120)||(await publicSettings()).beneficiary||'Arnaud BANAKEN';
  if(old?.status==='PUBLISHED'&&!title)throw new HttpError(400,'Conservez un titre pour ce livre déjà publié.');let slug=old?.slug;if(!slug){const base=(title.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,95)||'livre');slug=base;if(await db().prepare('SELECT id FROM works WHERE slug=?').bind(slug).first())slug+='-'+id.slice(0,8)}
  let cover=old?.cover||'/hero.png';if(b.cover_asset){const asset=await db().prepare("SELECT id FROM assets WHERE id=? AND mime IN ('image/png','image/jpeg','image/webp')").bind(str(b.cover_asset,100)).first<any>();if(!asset)throw new HttpError(400,'Image de couverture introuvable.');cover='/api/covers/'+asset.id}
  await db().prepare("INSERT INTO works(id,slug,title,author,subtitle,synopsis,cover,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,'DRAFT',?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,author=excluded.author,synopsis=excluded.synopsis,cover=excluded.cover,updated_at=excluded.updated_at").bind(id,slug,title,author,old?.subtitle||'',str(b.synopsis,30000),cover,now,now).run();return json({id,slug,author,cover});
 }
 const work=await db().prepare('SELECT * FROM works WHERE id=?').bind(str(b.work_id,80)).first<any>();if(!work)throw new HttpError(404,'Livre introuvable.');
 if(b.action==='chapter'){
  const id=str(b.id,80)||crypto.randomUUID(),old=await db().prepare('SELECT * FROM contents WHERE id=?').bind(id).first<any>();if(old&&(old.work_id!==work.id||!['TEXT','PDF'].includes(old.format)))throw new HttpError(400,'Chapitre invalide.');
  let doc;try{doc=validateBook(b.document)}catch(e){throw new HttpError(400,(e as Error).message)}for(const asset of bookAssets(doc))if(!await db().prepare("SELECT id FROM assets WHERE id=? AND mime IN ('image/png','image/jpeg','image/webp')").bind(asset).first())throw new HttpError(400,'Image introuvable.');
  const sourceId=old?.source_id||str(b.source_id,80)||null,source=sourceId?await db().prepare('SELECT * FROM source_files WHERE id=? AND work_id=?').bind(sourceId,work.id).first<any>():null;if(sourceId&&!source)throw new HttpError(400,'PDF introuvable.');
  const start=old?.start_page||1,end=old?.end_page||source?.page_count||null;if(source&&(doc.origin!=='PDF'||doc.pages.length!==end-start+1||doc.pages.some((p,i)=>p.number!==start+i)))throw new HttpError(400,'Conservez les pages du chapitre PDF.');
  const sequence=old?.sequence??((await db().prepare("SELECT MAX(sequence) AS n FROM contents WHERE work_id=? AND format IN ('TEXT','PDF')").bind(work.id).first<any>())?.n||0)+1;
  const format=old?.format||(source?'PDF':'TEXT'),title=str(b.title,200)||'Chapitre '+sequence,access=choice(b.access_type||old?.access_type||'FREE',['FREE','PREMIUM','PREVIEW']),chars=integer(b.characters_per_page||1800,300,8000),text=doc.pages.flatMap(p=>p.blocks.map(blockText)).join('\n\n');
  const key='reading/'+crypto.randomUUID()+'.json';await bucket().put(key,JSON.stringify(doc),{httpMetadata:{contentType:'application/json'}});
  await db().batch([
   db().prepare("INSERT INTO contents(id,work_id,format,sequence,title,access_type,text_content,source_id,source_version,start_page,end_page,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,'DRAFT',?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,access_type=excluded.access_type,text_content=excluded.text_content,updated_at=excluded.updated_at").bind(id,work.id,format,sequence,title,access,text,sourceId,old?.source_version||source?.version||null,start,end,now,now),
   db().prepare('INSERT INTO reader_documents(owner,book_key,characters_per_page,pdf_download,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(owner) DO UPDATE SET book_key=excluded.book_key,characters_per_page=excluded.characters_per_page,pdf_download=excluded.pdf_download,updated_at=excluded.updated_at').bind('content:'+id,key,chars,b.pdf_download?1:0,now)
  ]);return json({id,title,sequence,format,source_id:sourceId,start_page:start,end_page:end});
 }
 if(b.action==='publish'){
  if(!work.title.trim())throw new HttpError(400,'Ajoutez le titre du livre avant de publier.');
  const chapters=(await db().prepare("SELECT * FROM contents WHERE work_id=? AND format IN ('TEXT','PDF') AND status!='ARCHIVED' ORDER BY sequence,id").bind(work.id).all<any>()).results;if(!chapters.length)throw new HttpError(400,'Ajoutez un texte ou un PDF avant de publier.');
  for(const c of chapters){const {document}=await readingDocument(c);if(!document?.pages.some(p=>p.blocks.some(b=>b.type==='image'||blockText(b).trim())))throw new HttpError(400,'Préparez le contenu de « '+c.title+' » avant de publier.');if(c.access_type==='PREVIEW'&&!c.preview_text&&!c.preview_key)throw new HttpError(400,'Ajoutez l’extrait gratuit de « '+c.title+' » ou choisissez Gratuit / Initié.')}
  await db().batch([db().prepare("UPDATE works SET status='PUBLISHED',publish_at=NULL,updated_at=? WHERE id=?").bind(now,work.id),...chapters.map(c=>db().prepare("UPDATE contents SET status='PUBLISHED',publish_at=NULL,updated_at=? WHERE id=?").bind(now,c.id))]);return json({ok:true,url:'/work/'+work.slug});
 }
 if(b.action==='order'){
  const rows=(await db().prepare("SELECT id,format FROM contents WHERE work_id=? AND format IN ('TEXT','PDF') AND status!='ARCHIVED' ORDER BY sequence,id").bind(work.id).all<any>()).results;const ids=b.ids;if(!Array.isArray(ids)||ids.length!==rows.length||new Set(ids).size!==rows.length||ids.some(id=>!rows.some(r=>r.id===id)))throw new HttpError(400,'Ordre des chapitres invalide.');
  const max=(await db().prepare('SELECT MAX(sequence) AS n FROM contents WHERE work_id=?').bind(work.id).first<any>())?.n||0;
  // Temporary sequence slots avoid the existing unique constraint, including archived rows.
  await db().batch([...ids.map((id,i)=>db().prepare('UPDATE contents SET sequence=? WHERE id=?').bind(max+rows.length+i+1,id)),...ids.map((id,i)=>db().prepare('UPDATE contents SET sequence=?,canonical_start=NULL,canonical_end=NULL,updated_at=? WHERE id=?').bind(max+i+1,now,id))]);return json({ok:true});
 }
 throw new HttpError(400,'Action inconnue.');
});}
