'use client';
import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import {blockText,type BookDocument} from '../lib/book-model';
import {passageBetween,type TextPoint} from '../lib/reader-selection';
import type {Row} from './ui';

function domPoint(node:Node,offset:number):TextPoint|null{
 const el=(node.nodeType===1?node:node.parentElement) as HTMLElement|null,block=el?.closest<HTMLElement>('[data-book-block]');
 if(!block)return null;const r=document.createRange();r.selectNodeContents(block);r.setEnd(node,offset);
 return {block_id:block.dataset.bookBlock!,offset:Number(block.dataset.offset||0)+r.toString().length};
}
function atPointer(stage:HTMLElement,x:number,y:number):TextPoint|null{
 const d=document as any;let node:Node|undefined,offset=0;
 if(d.caretPositionFromPoint){const p=d.caretPositionFromPoint(x,y);node=p?.offsetNode;offset=p?.offset||0}
 else if(d.caretRangeFromPoint){const p=d.caretRangeFromPoint(x,y);node=p?.startContainer;offset=p?.startOffset||0}
 return node&&stage.contains(node)?domPoint(node,offset):null;
}
function localRange(el:HTMLElement,start:number,end:number){
 const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),r=document.createRange();let n:Node|null,pos=0,found=false;
 while(n=walker.nextNode()){const size=n.textContent?.length||0;if(!found&&start<=pos+size){r.setStart(n,Math.max(0,start-pos));found=true}if(found&&end<=pos+size){r.setEnd(n,Math.max(0,end-pos));return r}pos+=size}return null;
}
export function useReaderSelection(stage:RefObject<HTMLDivElement|null>,doc:BookDocument,selection:Row|null,setSelection:(s:Row|null)=>void,pageKey:unknown){
 const [start,setStart]=useState<TextPoint|null>(null),[menu,setMenu]=useState<TextPoint|null>(null),[stop,setStop]=useState<TextPoint|null>(null),[rects,setRects]=useState<{x:number;y:number;width:number;height:number;kind:string}[]>([]);
 const startRef=useRef(start),menuRef=useRef(menu),suppress=useRef(0);startRef.current=start;menuRef.current=menu;
 const clear=()=>{suppress.current=Date.now()+250;setSelection(null);setStart(null);setMenu(null);window.getSelection()?.removeAllRanges()};
 const wordEdge=(p:TextPoint,end=false)=>{const b=doc.pages.flatMap(p=>p.blocks).find(b=>b.id===p.block_id),text=b?blockText(b):'';let offset=p.offset;while(end?offset<text.length&&!/\s/.test(text[offset]):offset>0&&!/\s/.test(text[offset-1]))offset+=end?1:-1;return {...p,offset}};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')clear()};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[]);
 useEffect(()=>{const read=()=>{if(startRef.current||menuRef.current||Date.now()<suppress.current)return;const s=window.getSelection();if(!s?.rangeCount||s.isCollapsed||!stage.current?.contains(s.anchorNode)||!stage.current.contains(s.focusNode))return;const r=s.getRangeAt(0),a=domPoint(r.startContainer,r.startOffset),b=domPoint(r.endContainer,r.endOffset);if(a&&b){const next=passageBetween(doc,a,b);if(next)setSelection(next)}};document.addEventListener('selectionchange',read);return()=>document.removeEventListener('selectionchange',read)},[doc]);
 useEffect(()=>{const el=stage.current;if(!el)return;let timer:ReturnType<typeof setTimeout>|undefined,origin:{x:number;y:number;id:number}|null=null;
 const cancel=()=>{clearTimeout(timer);origin=null};
 const show=(x:number,y:number)=>{const p=atPointer(el,x,y);if(p){suppress.current=Date.now()+900;setMenu(p)}};
 const down=(e:PointerEvent)=>{cancel();if(!e.isPrimary||e.button!==0||(e.target as HTMLElement).closest('button,a,input'))return;origin={x:e.clientX,y:e.clientY,id:e.pointerId};timer=setTimeout(()=>{if(origin)show(origin.x,origin.y)},600)};
 const move=(e:PointerEvent)=>{if(origin&&Math.hypot(e.clientX-origin.x,e.clientY-origin.y)>12)cancel()};
 const context=(e:MouseEvent)=>{if(atPointer(el,e.clientX,e.clientY)){e.preventDefault();show(e.clientX,e.clientY)}};
 el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',cancel);el.addEventListener('pointercancel',cancel);el.addEventListener('contextmenu',context);
 return()=>{cancel();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',cancel);el.removeEventListener('pointercancel',cancel);el.removeEventListener('contextmenu',context)};
 },[doc]);
 useLayoutEffect(()=>{const el=stage.current;if(!el)return;let frame=0;const draw=()=>{const next:typeof rects=[];const bounds=el.parentElement!.getBoundingClientRect(),clip=el.getBoundingClientRect();for(const block of Array.from(el.querySelectorAll<HTMLElement>('[data-book-block]'))){const offset=Number(block.dataset.offset||0),length=block.textContent?.length||0;
 const add=(r:Range,kind:string)=>{for(const box of Array.from(r.getClientRects())){const top=Math.max(box.top,clip.top),bottom=Math.min(box.bottom,clip.bottom);if(bottom<=top)continue;next.push({x:box.left-bounds.left,y:top-bounds.top,width:kind==='selected'?box.width:Math.max(3,box.width),height:bottom-top,kind})}};
 for(const s of selection?.segments||[]){if(s.block_id!==block.dataset.bookBlock)continue;const a=Math.max(0,s.start-offset),b=Math.min(length,s.end-offset);if(b>a){const r=localRange(block,a,b);if(r)add(r,'selected')}}
 for(const [point,kind] of [[start,'start'],[stop,'stop']] as const){if(!point||point.block_id!==block.dataset.bookBlock||point.offset<offset||point.offset>=offset+length)continue;const r=localRange(block,point.offset-offset,Math.min(length,point.offset-offset+1));if(r)add(r,kind)}
 }setRects(next)};const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)};draw();const resize=new ResizeObserver(schedule);resize.observe(el);el.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);return()=>{resize.disconnect();el.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame)}},[selection,start,stop,pageKey]);
 return {start,menu,stop,rects,clear,setMenu,setStop,begin:()=>{if(menu){setStart(wordEdge(menu));setSelection(null);setMenu(null);window.getSelection()?.removeAllRanges()}},finish:()=>{if(start&&menu){const next=passageBetween(doc,start,wordEdge(menu,true));if(next){setSelection(next);setStart(null);setMenu(null);window.getSelection()?.removeAllRanges()}}}};
}
