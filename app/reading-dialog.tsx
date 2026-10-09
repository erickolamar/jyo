'use client';
import {useEffect,useRef,type ReactNode} from 'react';
export default function ReadingDialog({title,children,onDismiss}:{title:string;children:ReactNode;onDismiss:()=>void}){
 const ref=useRef<HTMLDivElement>(null),dismiss=useRef(onDismiss);dismiss.current=onDismiss;
 useEffect(()=>{const before=document.activeElement as HTMLElement|null;ref.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.stopPropagation();dismiss.current();}if(e.key!=='Tab')return;const items=Array.from(ref.current?.querySelectorAll<HTMLElement>('button,a[href],input')||[]);if(!items.length){e.preventDefault();return;}if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===ref.current)){e.preventDefault();items.at(-1)?.focus()}else if(!e.shiftKey&&(document.activeElement===items.at(-1)||document.activeElement===ref.current)){e.preventDefault();items[0].focus()}};document.addEventListener('keydown',key,true);return()=>{document.removeEventListener('keydown',key,true);before?.focus()}},[]);
 return <div className="book-share-overlay"><div className="book-share-dialog reading-report" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} ref={ref}><div className="jyo-wordmark">JYO</div><p>Ici, on va plus loin…</p><h2>{title}</h2>{children}</div></div>;
}
