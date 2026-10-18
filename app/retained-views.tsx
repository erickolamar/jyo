'use client';
import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
const ViewActive=createContext(true);
export const useViewActive=()=>useContext(ViewActive);
const mainViews=['/','/discover','/library','/community'];
export const retainableView=(path:string)=>mainViews.includes(path)||/^\/work\/[^/]+$/.test(path);
export function retainPaths(previous:string[],active:string){if(!retainableView(active))return previous;const next=[...previous.filter(p=>p!==active),active];const works=next.filter(p=>p.startsWith('/work/'));return next.filter(p=>!p.startsWith('/work/')||works.slice(-2).includes(p))}
export default function RetainedViews({path,signedIn,children}:{path:string;signedIn:boolean;children:(path:string)=>ReactNode}){
 const [visited,setVisited]=useState<string[]>(()=>retainableView(path)?[path]:[]);
 useEffect(()=>{if(retainableView(path))setVisited(v=>retainPaths(v,path))},[path]);
 // Warm the catalogue and library once, after the active screen has painted.
 useEffect(()=>{if(!mainViews.includes(path))return;const warm=()=>setVisited(v=>[...new Set([...v,'/discover',...(signedIn?['/library']:[])])]);const idle=window as Window&{requestIdleCallback?:(fn:()=>void,options:{timeout:number})=>number;cancelIdleCallback?:(id:number)=>void};if(idle.requestIdleCallback){const id=idle.requestIdleCallback(warm,{timeout:2500});return()=>idle.cancelIdleCallback?.(id)}const id=setTimeout(warm,1200);return()=>clearTimeout(id)},[signedIn,mainViews.includes(path)]);
 const pages=retainPaths(visited,path);
 return <>{pages.map(p=><div key={p} data-retained-view={p} hidden={p!==path}><ViewActive.Provider value={p===path}>{children(p)}</ViewActive.Provider></div>)}</>;
}
