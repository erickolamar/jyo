import {blockText,type BookDocument} from './book-model';
export type TextPoint={block_id:string;offset:number};
export type TextSegment={block_id:string;start:number;end:number;text:string};
export function passageBetween(doc:BookDocument,a:TextPoint,b:TextPoint){
 const blocks=doc.pages.flatMap(p=>p.blocks).filter(b=>b.type==='text');
 let first=blocks.findIndex(x=>x.id===a.block_id),last=blocks.findIndex(x=>x.id===b.block_id);
 if(first<0||last<0)return null;
 if(first>last||first===last&&a.offset>b.offset){[first,last]=[last,first];[a,b]=[b,a]}
 const segments:TextSegment[]=[];
 for(let i=first;i<=last;i++){
  const text=blockText(blocks[i]),start=Math.max(0,Math.min(text.length,i===first?a.offset:0)),end=Math.max(start,Math.min(text.length,i===last?b.offset:text.length));
  // Keep each persisted annotation within the existing server limit.
  for(let n=start;n<end;n+=10000)segments.push({block_id:blocks[i].id,start:n,end:Math.min(end,n+10000),text:text.slice(n,Math.min(end,n+10000))});
 }
 if(!segments.length)return null;
 const text=segments.map((s,i)=>(i&&segments[i-1].block_id!==s.block_id?'\n':'')+s.text).join('');
 return {...segments[0],segments,text,count:Array.from(text).length};
}
