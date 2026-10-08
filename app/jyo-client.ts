'use client';
import type {Row} from './ui';
export const formatName:Row={TEXT:'Lire',PDF:'Lire',AUDIO:'Écouter',VIDEO:'Regarder'};
export const readingKind=(c:Row)=>['TEXT','PDF'].includes(c.format)?'TEXT':c.format;
export const readerUrl=(c:Row)=>`/${['TEXT','PDF'].includes(c.format)?'read':c.format==='AUDIO'?'listen':'watch'}/${c.id||c.content_id}`;
export function localRows(userId?:string){try{return JSON.parse(localStorage.getItem('jyo-progress:'+ (userId||'guest'))||'{}') as Record<string,Row>}catch{return {}}}
export function storePosition(id:string,position:Row,userId?:string){try{const rows=localRows(userId);rows[id]=position;localStorage.setItem('jyo-progress:'+(userId||'guest'),JSON.stringify(rows))}catch{}}
export function anonymousId(){try{let id=localStorage.getItem('jyo-anonymous');if(!id){id=crypto.randomUUID();localStorage.setItem('jyo-anonymous',id)}return id}catch{return ''}}
export function trackClient(event:string,work_id:string,content_id?:string){void fetch('/api/jyo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,work_id,content_id,anonymous_id:anonymousId()})}).catch(()=>{});}
export function resumePosition(row:Row|undefined,version?:number){if(!row)return {};const parse=(v:any)=>{try{return typeof v==='string'?JSON.parse(v):v}catch{return null}};const manual=parse(row.manual_resume_position);return manual&&(!version||!manual.source_version||manual.source_version===version)?manual:parse(row.automatic_position)||row;}
export async function shareWork(work:Row,type='WORK_SHARE',extra:Row={}){const r=await fetch('/api/shares',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({work_id:work.id,share_type:type,...extra})});const data:any=await r.json();if(!r.ok)throw new Error(data.error);const url=new URL(data.url,location.origin).href;if(navigator.share){try{await navigator.share({title:work.title,text:(type==='TEXT_FRAGMENT'?'« '+extra.text+' »\n\n':'')+'JYO — Ici, on va plus loin...',url})}catch(e){if((e as Error).name!=='AbortError')throw e}}else{try{await navigator.clipboard.writeText(url)}catch{}}return url;}
