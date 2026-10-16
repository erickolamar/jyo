'use client';
import {useEffect,useLayoutEffect,useRef,useState,type RefObject} from 'react';
import {blockText,type BookDocument} from '../lib/book-model';
import {passageBetween,type TextPoint} from '../lib/reader-selection';
import {createSelectionGesture} from '../lib/selection-gesture';
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
 const [start,setStart]=useState<TextPoint|null>(null),[end,setEnd]=useState<TextPoint|null>(null),[stop,setStop]=useState<TextPoint|null>(null),[rects,setRects]=useState<{x:number;y:number;width:number;height:number;kind:string}[]>([]);
 const startRef=useRef<TextPoint|null>(null),endRef=useRef<TextPoint|null>(null),blocked=useRef(0),gestureRef=useRef<ReturnType<typeof createSelectionGesture>|null>(null),setSelectionRef=useRef(setSelection);setSelectionRef.current=setSelection;
 const clear=()=>{blocked.current=Date.now()+600;startRef.current=null;endRef.current=null;setStart(null);setEnd(null);setSelectionRef.current(null);window.getSelection()?.removeAllRanges()};
 const edge=(p:TextPoint,finish=false)=>{const b=doc.pages.flatMap(p=>p.blocks).find(b=>b.id===p.block_id),text=b?blockText(b):'';let offset=Math.min(p.offset,text.length);while(finish?offset<text.length&&!/\s/.test(text[offset]):offset>0&&!/\s/.test(text[offset-1]))offset+=finish?1:-1;return {...p,offset}};
 const extend=(p:TextPoint)=>{const a=startRef.current;if(!a)return;const blocks=doc.pages.flatMap(p=>p.blocks),ai=blocks.findIndex(b=>b.id===a.block_id),bi=blocks.findIndex(b=>b.id===p.block_id),forward=bi>ai||bi===ai&&p.offset>=a.offset,b=edge(p,forward);endRef.current=b;setEnd(b);setSelectionRef.current(passageBetween(doc,a,b));window.getSelection()?.removeAllRanges()};
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')clear()};document.addEventListener('keydown',key);return()=>document.removeEventListener('keydown',key)},[]);
 useEffect(()=>{const el=stage.current;if(!el)return;let touchId:number|null=null;
 const point=(p:{x:number;y:number})=>atPointer(el,p.x,p.y);
 const g=createSelectionGesture({now:Date.now,schedule:(f,ms)=>setTimeout(f,ms),unschedule:id=>clearTimeout(id as ReturnType<typeof setTimeout>),active:()=>!!startRef.current,cancelSelection:clear,hold:p=>{const at=point(p);if(!at)return;if(!startRef.current){const a=edge(at);startRef.current=a;setStart(a);setSelectionRef.current(null);setEnd(null);endRef.current=null}else extend(at);window.getSelection()?.removeAllRanges()},drag:p=>{const at=point(p);if(at)extend(at)}});gestureRef.current=g;
 const ignored=(target:EventTarget|null)=>!(target instanceof Element)||!!target.closest('button,a,input,select,textarea');
 const down=(e:PointerEvent)=>{if(e.pointerType==='touch'||!e.isPrimary||e.button!==0||ignored(e.target))return;if(startRef.current||atPointer(el,e.clientX,e.clientY)){g.down({x:e.clientX,y:e.clientY});el.setPointerCapture(e.pointerId)}};
 const move=(e:PointerEvent)=>{if(e.pointerType!=='touch'&&g.move({x:e.clientX,y:e.clientY}))e.preventDefault()};
 const up=(e:PointerEvent)=>{if(e.pointerType!=='touch'){g.up({x:e.clientX,y:e.clientY});if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId)}};
 const ts=(e:TouchEvent)=>{if(e.touches.length!==1){g.cancel();touchId=null;return}if(ignored(e.target))return;const t=e.touches[0];if(startRef.current||atPointer(el,t.clientX,t.clientY)){touchId=t.identifier;g.down({x:t.clientX,y:t.clientY})}};
 const tm=(e:TouchEvent)=>{if(e.touches.length!==1){g.cancel();touchId=null;return}const t=Array.from(e.touches).find(t=>t.identifier===touchId);if(t&&g.move({x:t.clientX,y:t.clientY})&&e.cancelable)e.preventDefault()};
 const te=(e:TouchEvent)=>{const t=Array.from(e.changedTouches).find(t=>t.identifier===touchId);if(t)g.up({x:t.clientX,y:t.clientY});touchId=null};
 const cancel=(e?:Event)=>{if(e instanceof PointerEvent&&e.pointerType==='touch')return;g.cancel();touchId=null};const context=(e:Event)=>{if(!ignored(e.target))e.preventDefault()};
 el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',cancel);el.addEventListener('touchstart',ts,{passive:true});el.addEventListener('touchmove',tm,{passive:false});el.addEventListener('touchend',te);el.addEventListener('touchcancel',cancel);el.addEventListener('contextmenu',context);
 return()=>{cancel();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',cancel);el.removeEventListener('touchstart',ts);el.removeEventListener('touchmove',tm);el.removeEventListener('touchend',te);el.removeEventListener('touchcancel',cancel);el.removeEventListener('contextmenu',context)};
 },[doc]);
 useLayoutEffect(()=>{const el=stage.current;if(!el)return;let frame=0;const draw=()=>{const next:typeof rects=[];const bounds=el.parentElement!.getBoundingClientRect(),clip=el.getBoundingClientRect();for(const block of Array.from(el.querySelectorAll<HTMLElement>('[data-book-block]'))){const offset=Number(block.dataset.offset||0),length=block.textContent?.length||0;
 const add=(r:Range,kind:string)=>{for(const box of Array.from(r.getClientRects())){const top=Math.max(box.top,clip.top),bottom=Math.min(box.bottom,clip.bottom);if(bottom<=top||box.right<=clip.left||box.left>=clip.right)continue;next.push({x:Math.max(box.left,clip.left)-bounds.left,y:top-bounds.top,width:Math.min(box.right,clip.right)-Math.max(box.left,clip.left),height:bottom-top,kind})}};
 for(const s of selection?.segments||[]){if(s.block_id!==block.dataset.bookBlock)continue;const a=Math.max(0,s.start-offset),b=Math.min(length,s.end-offset);if(b>a){const r=localRange(block,a,b);if(r)add(r,'selected')}}
 for(const [point,kind] of [[start,'start'],[end,'end'],[stop,'stop']] as const){if(!point||point.block_id!==block.dataset.bookBlock||point.offset<offset||point.offset>offset+length||!length)continue;const at=Math.min(length-1,Math.max(0,point.offset-offset-(kind==='stop'?1:0))),r=localRange(block,at,at+1);if(!r)continue;
 if(kind!=='stop'){add(r,kind);continue}
 const box=r.getBoundingClientRect();if(box.bottom<=clip.top||box.top>=clip.bottom)continue;
 // Find the visual line end across formatted runs, including adjacent PDF text blocks.
 const paragraph=block.closest('p')||block,lineRange=document.createRange();lineRange.selectNodeContents(paragraph);let right=box.right;for(const line of Array.from(lineRange.getClientRects()))if(Math.abs(line.top-box.top)<Math.max(2,box.height*.35))right=Math.max(right,line.right);
 next.push({x:Math.min(right+3,clip.right-35)-bounds.left,y:Math.max(box.top,clip.top)-bounds.top,width:32,height:Math.min(44,Math.max(32,box.height+8)),kind});
 }
 }setRects(next)};const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw)};draw();const resize=new ResizeObserver(schedule);resize.observe(el);el.addEventListener('scroll',schedule);window.addEventListener('resize',schedule);return()=>{resize.disconnect();el.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);cancelAnimationFrame(frame)}},[selection,start,end,stop,pageKey]);
 return {start,end,stop,rects,clear,setStop,busy:()=>Date.now()<blocked.current||!!gestureRef.current?.busy(),active:()=>!!startRef.current};
}
