'use client';
import {useEffect,useRef,type RefObject} from 'react';

// A temporary paper leaf turns above the next page. It never participates in
// selection, focus, reading-position measurements or persisted progress.
export function usePageTurn(root:RefObject<HTMLDivElement|null>,stage:RefObject<HTMLDivElement|null>){
 const cancel=useRef<()=>void>(()=>{});
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),stop=()=>cancel.current();window.addEventListener('resize',stop);media.addEventListener('change',stop);return()=>{stop();window.removeEventListener('resize',stop);media.removeEventListener('change',stop)}},[]);
 return (direction:number)=>{
  cancel.current();
  const host=root.current,area=stage.current;
  if(!host||!area||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const pages=Array.from(area.querySelectorAll<HTMLElement>('.book-spread>.book-page'));
  const page=direction>0?pages.at(-1):pages[0];if(!page)return;
  const bounds=area.getBoundingClientRect(),rect=page.getBoundingClientRect();
  if(bounds.width<1||bounds.height<1)return;
  const flowing=host.classList.contains('book-scrolling');
  const top=flowing?bounds.top:Math.max(bounds.top,rect.top),height=flowing?bounds.height:Math.min(rect.bottom,bounds.bottom)-top;
  if(height<1)return;
  const scene=document.createElement('div'),sheet=document.createElement('div'),front=document.createElement('div'),back=document.createElement('div');
  scene.className='book-turn-scene';scene.setAttribute('aria-hidden','true');scene.inert=true;
  Object.assign(scene.style,{left:bounds.left+'px',top:bounds.top+'px',width:bounds.width+'px',height:bounds.height+'px',perspective:Math.max(1200,bounds.width*2)+'px'});
  sheet.className='book-turn-sheet';Object.assign(sheet.style,{left:rect.left-bounds.left+'px',top:top-bounds.top+'px',width:rect.width+'px',height:height+'px',transformOrigin:direction>0?'left center':'right center'});
  front.className='book-turn-face';back.className='book-turn-face book-turn-back';
  const copy=page.cloneNode(true) as HTMLElement;
  for(const node of [copy,...Array.from(copy.querySelectorAll<HTMLElement>('*'))]){node.removeAttribute('id');node.removeAttribute('data-book-block');node.removeAttribute('aria-label')}
  Object.assign(copy.style,{position:'absolute',left:'0',top:rect.top-top+'px',width:rect.width+'px',height:rect.height+'px',margin:'0',boxShadow:'none',pointerEvents:'none'});
  front.appendChild(copy);sheet.appendChild(front);sheet.appendChild(back);scene.appendChild(sheet);host.appendChild(scene);
  const angle=direction>0?-170:170;
  const motion=sheet.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${angle*.53}deg)`,offset:.6},{transform:`rotateY(${angle}deg)`}],{duration:560,easing:'cubic-bezier(.25,.6,.25,1)',fill:'forwards'});
  const fade=scene.animate([{opacity:1},{opacity:1,offset:.65},{opacity:0}],{duration:560,fill:'forwards'});
  const shade=front.animate([{boxShadow:'inset 0 0 0 #0000'},{boxShadow:`inset ${direction>0?'-':''}45px 0 55px -25px #0004`,offset:.55},{boxShadow:'inset 0 0 0 #0000'}],{duration:560,fill:'forwards'});
  const cleanup=()=>{motion.onfinish=null;motion.cancel();shade.cancel();fade.cancel();scene.remove()};
  cancel.current=cleanup;motion.onfinish=cleanup;
 };
}
