import {db,HttpError} from './server';
import {published,contentUrl} from './jyo';
import {readingDocument} from './book-server';
import {blockText} from './book-model';
export const shareOrigin='https://arcanum-recits.clark-banaken.chatgpt.site';
export const normalizedQuote=(text:string)=>text.replace(/\s+/g,' ').trim();
export async function allowedQuoteText(c:any){
 if(c.share_text)return normalizedQuote(c.share_text);
 if(c.access_type!=='FREE')return '';
 const rich=await readingDocument(c);
 return normalizedQuote(rich.document?rich.document.pages.flatMap(p=>p.blocks.map(blockText)).join(' '):c.text_content||'');
}
export async function publicFragment(slug:string){
 const s=await db().prepare('SELECT * FROM shares WHERE public_slug=? AND (expires_at IS NULL OR expires_at>?)').bind(slug,Date.now()).first<any>();
 if(!s)throw new HttpError(404,'Ce fragment n’est plus disponible.');
 const {works,contents}=await published(),work=works.find(w=>w.id===s.work_id),c=contents.find(c=>c.id===s.content_id);
 if(!work)throw new HttpError(404,'Œuvre indisponible.');
 if(s.content_id&&(!c||!c.sharing_allowed))throw new HttpError(404,'Ce fragment n’est plus partagé.');
 if(c&&s.share_type==='TEXT_FRAGMENT'){
  const full=await db().prepare('SELECT * FROM contents WHERE id=?').bind(c.id).first<any>();
  if(!(await allowedQuoteText(full)).includes(normalizedQuote(s.text_content)))throw new HttpError(404,'Ce passage n’est plus partagé.');
 }
 const first=contents.find(c=>c.work_id===work.id&&c.access_type==='FREE');
 const direct=!!c&&c.access_type==='FREE'&&s.share_type==='TEXT_FRAGMENT';
 return {record:s,work,share:{share_type:s.share_type,text:s.text_content,content_id:s.content_id,mediaAvailable:!!s.media_key},direct_read:direct,start_url:direct?contentUrl(c)+'?fragment='+encodeURIComponent(slug):c?'/paywall/'+c.id:first?contentUrl(first):'/work/'+work.slug};
}
