'use client';
import {useEffect,useState} from 'react';
import {idleLimit} from '../lib/reading-time-model';
import {rememberSecond,syncTime} from './reading-time-store';
export default function ReadingClock({owner}:{owner:string}){
 const [notice,setNotice]=useState(false);
 useEffect(()=>{
  let last=Date.now(),interaction=last,book='',premiumGoal=false,paused=false,alive=true;
  const goal=()=>{if(owner!=='guest')fetch('/api/reading-time?status=1').then(r=>r.ok?r.json():null).then((d:any)=>{if(alive)premiumGoal=!!d?.premium&&d?.goal?.status==='ACTIVE'}).catch(()=>{})};goal();
  const activity=()=>{interaction=Date.now();if(paused){paused=false;setNotice(false)}};
  const tick=()=>{const now=Date.now(),gap=now-last;last=now;const el=document.querySelector<HTMLElement>('[data-reading-key]');if(!el){book='';setNotice(false);return}const current=el.dataset.readingKey!;if(current!==book){book=current;interaction=now;return}const kind=el.dataset.readingKind||'TEXT',media=el.querySelector<HTMLMediaElement>('audio,video'),text=el.querySelector('.book-page-content')?.textContent||el.textContent||'';
   const inactive=now-interaction>idleLimit(text),blocked=!!document.querySelector('.book-settings,.book-panel,.book-share-overlay,.book-gate,[role="dialog"]'),playing=kind!=='TEXT'&&media&&!media.paused&&!media.ended&&!media.seeking&&media.readyState>=2;
   const active=(kind!=='TEXT'||!!el.querySelector('.book-page'))&&!document.hidden&&document.hasFocus()&&!blocked&&(kind==='TEXT'?!inactive:playing);
   if(!active||gap>2500||gap<0){if(!document.hidden&&inactive&&kind==='TEXT'&&premiumGoal&&!blocked){paused=true;setNotice(true)}return}
   rememberSecond(owner,current,el.dataset.readingTitle||'Lecture',kind,now-1000);
  };
  const flush=()=>{void syncTime(owner)},visibility=()=>{last=Date.now();if(document.hidden)flush();else activity()};
  const events=['pointerdown','keydown','touchstart','scroll'];for(const event of events)document.addEventListener(event,activity,{capture:true,passive:true});document.addEventListener('visibilitychange',visibility);window.addEventListener('pagehide',flush);window.addEventListener('online',flush);window.addEventListener('jyo:commitment',goal);
  const timer=setInterval(tick,1000),sender=setInterval(flush,15000);flush();
  return()=>{alive=false;clearInterval(timer);clearInterval(sender);for(const event of events)document.removeEventListener(event,activity,true);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('pagehide',flush);window.removeEventListener('online',flush);window.removeEventListener('jyo:commitment',goal);flush()};
 },[owner]);
 return notice?<div className="time-paused" role="status"><strong>Temps de lecture suspendu</strong><span>Reprenez votre lecture pour relancer le suivi.</span><button onClick={()=>setNotice(false)}>Compris</button></div>:null;
}
