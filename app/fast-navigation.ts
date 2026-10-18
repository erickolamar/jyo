'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';

const supported=(path:string)=>['/','/discover','/library','/community','/profile','/gifts'].includes(path)||/^\/work\/[^/]+$/.test(path);
// Keep catalogue views inside their existing React tree. Authentication,
// payments, the editor and reader exits retain their normal navigation guards.
export function useFastNavigation(initial:string){
 const [path,setPath]=useState(initial),active=useRef(initial),scrolls=useRef(new Map<string,number>()),pending=useRef<{y:number;hash:string;start:number}|null>(null);
 useEffect(()=>{if(initial!==active.current&&!supported(initial)){active.current=initial;setPath(initial)}},[initial]);
 useEffect(()=>{
  const previousRestoration=history.scrollRestoration;history.scrollRestoration='manual';
  const navigate=(url:URL,push:boolean)=>{scrolls.current.set(active.current,window.scrollY);pending.current={y:scrolls.current.get(url.pathname)||0,hash:url.hash,start:performance.now()};active.current=url.pathname;if(push)history.pushState({...history.state,jyoView:true},'',url.pathname+url.search+url.hash);setPath(url.pathname);window.dispatchEvent(new Event('jyo:navigated'))};
  const click=(e:MouseEvent)=>{if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const link=(e.target as Element)?.closest<HTMLAnchorElement>('a[href]');if(!link||link.target&&link.target!=='_self'||link.hasAttribute('download'))return;const url=new URL(link.href,location.href);if(url.origin!==location.origin||!supported(url.pathname)||!supported(active.current)||document.querySelector('.book-reader,.private-editor'))return;if(url.pathname===active.current)return;e.preventDefault();navigate(url,true)};
  const pop=()=>{const url=new URL(location.href);if(document.querySelector('.private-editor')&&!window.confirm('Quitter la composition du livre ? Vérifiez que vos modifications sont sauvegardées.')){history.pushState({...history.state,jyoView:true},'',active.current);return;}if(supported(url.pathname)&&supported(active.current))navigate(url,false);else location.reload()};
  document.addEventListener('click',click);window.addEventListener('popstate',pop);
  return()=>{document.removeEventListener('click',click);window.removeEventListener('popstate',pop);history.scrollRestoration=previousRestoration};
 },[]);
 useLayoutEffect(()=>{const p=pending.current;if(!p)return;const frame=requestAnimationFrame(()=>{const target=p.hash?document.getElementById(decodeURIComponent(p.hash.slice(1))):null;if(target)target.scrollIntoView();else window.scrollTo(0,p.y);const main=document.querySelector<HTMLElement>('#main');if(main){main.setAttribute('tabindex','-1');main.focus({preventScroll:true});main.dataset.navigationMs=String(Math.round(performance.now()-p.start))}pending.current=null});return()=>cancelAnimationFrame(frame)},[path]);
 return path;
}
