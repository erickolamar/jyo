'use client';
import {useEffect,useRef,useState} from 'react';
import type {PDFDocumentProxy,PDFDocumentLoadingTask,RenderTask,TextLayer} from 'pdfjs-dist';
import {ChevronLeft,ChevronRight,Minus,Plus,Maximize} from 'lucide-react';

type Props={src:string;title:string;initialPage?:number;onProgress:(page:number,total:number)=>void;onFinish?:()=>void;finishLabel?:string};
export default function PdfReader({src,title,initialPage=1,onProgress,onFinish,finishLabel}:Props){
 const [pdf,setPdf]=useState<PDFDocumentProxy|null>(null),[page,setPage]=useState(1),[pageInput,setPageInput]=useState('1'),[zoom,setZoom]=useState(1),[width,setWidth]=useState(0),[loading,setLoading]=useState(true),[rendering,setRendering]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const container=useRef<HTMLDivElement>(null),sheet=useRef<HTMLDivElement>(null),progress=useRef(onProgress),startPage=useRef(initialPage);
 progress.current=onProgress;startPage.current=initialPage;
 useEffect(()=>{const el=container.current;if(!el)return;const observer=new ResizeObserver(entries=>setWidth(entries[0].contentRect.width));observer.observe(el);return()=>observer.disconnect()},[]);
 useEffect(()=>{
  let cancelled=false,task:PDFDocumentLoadingTask|undefined;setPdf(null);setLoading(true);setError('');
  (async()=>{try{const engine=await import('pdfjs-dist');if(cancelled)return;const assets=`/pdfjs/${engine.version}/`;engine.GlobalWorkerOptions.workerSrc=assets+'pdf.worker.min.mjs';task=engine.getDocument({url:src,withCredentials:true,cMapUrl:assets+'cmaps/',cMapPacked:true,standardFontDataUrl:assets+'standard_fonts/',wasmUrl:assets+'wasm/'});const doc=await task.promise;if(cancelled)return;const restored=Math.max(1,Math.min(doc.numPages,Math.round(startPage.current||1)));setPage(restored);setPageInput(String(restored));setPdf(doc)}catch(e){if(!cancelled)setError((e as Error).name==='PasswordException'?'Ce PDF est protégé par un mot de passe. Importez une version sans mot de passe.':'Impossible d’ouvrir ce PDF. Vérifiez votre connexion et votre accès au contenu, puis réessayez.')}finally{if(!cancelled)setLoading(false)}})();
  return()=>{cancelled=true;void task?.destroy()};
 },[src,retry]);
 useEffect(()=>{
  if(!pdf||!width||!sheet.current)return;let cancelled=false,renderTask:RenderTask|undefined,textLayer:TextLayer|undefined;const host=sheet.current;host.replaceChildren();setRendering(true);setError('');
  (async()=>{try{const [p,engine]=await Promise.all([pdf.getPage(page),import('pdfjs-dist')]);if(cancelled)return;const base=p.getViewport({scale:1});const scale=Math.min(1.6,Math.max(0.1,(width-24)/base.width))*zoom;const viewport=p.getViewport({scale});const ratio=Math.min(window.devicePixelRatio||1,2,Math.sqrt(12_000_000/(viewport.width*viewport.height)));const canvas=document.createElement('canvas');canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;canvas.setAttribute('aria-label',`${title} — page ${page}`);canvas.setAttribute('role','img');host.style.width=`${viewport.width}px`;host.style.height=`${viewport.height}px`;host.style.setProperty('--total-scale-factor',String(scale));host.appendChild(canvas);renderTask=p.render({canvas,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});await renderTask.promise;if(cancelled)return;const layer=document.createElement('div');layer.className='pdf-text-layer';host.appendChild(layer);textLayer=new engine.TextLayer({textContentSource:p.streamTextContent(),container:layer,viewport});await textLayer.render();if(cancelled)return;setRendering(false);progress.current(page,pdf.numPages)}catch(e){if(!cancelled&&(e as Error).name!=='RenderingCancelledException'){setRendering(false);setError('Cette page ne peut pas être affichée. Réessayez ou ouvrez le document original.')}}})();
  return()=>{cancelled=true;renderTask?.cancel();textLayer?.cancel()};
 },[pdf,page,width,zoom,title]);
 function go(n:number){if(!pdf||!Number.isFinite(n))return;const target=Math.max(1,Math.min(pdf.numPages,Math.round(n)));setPage(target);setPageInput(String(target));container.current?.scrollTo({top:0,left:0})}
 return <div className="pdf-reader">
  <div className="pdf-controls" role="group" aria-label="Commandes du lecteur PDF">
   <div className="pdf-pagination"><button type="button" aria-label="Page précédente" disabled={!pdf||page<=1} onClick={()=>go(page-1)}><ChevronLeft size={20}/></button><form onSubmit={e=>{e.preventDefault();go(Number(pageInput))}}><label>Page <input aria-label="Numéro de page" inputMode="numeric" type="number" min={1} max={pdf?.numPages||1} disabled={!pdf} value={pageInput} onChange={e=>setPageInput(e.target.value)} onBlur={()=>go(Number(pageInput))}/></label><span> / {pdf?.numPages||'…'}</span></form><button type="button" aria-label="Page suivante" disabled={!pdf||page>=pdf.numPages} onClick={()=>go(page+1)}><ChevronRight size={20}/></button></div>
   <div className="pdf-zoom"><button type="button" aria-label="Réduire le zoom" disabled={zoom<=0.5} onClick={()=>setZoom(z=>Math.max(0.5,z-0.25))}><Minus size={18}/></button><span>{Math.round(zoom*100)} %</span><button type="button" aria-label="Agrandir le zoom" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+0.25))}><Plus size={18}/></button><button type="button" aria-label="Adapter à la largeur" title="Adapter à la largeur" onClick={()=>setZoom(1)}><Maximize size={18}/></button></div>
  </div>
  {loading&&<p className="pdf-status" role="status">Ouverture du PDF…</p>}
  {error&&<div className="notice error" role="alert"><p>{error}</p><button type="button" className="button outline" onClick={()=>setRetry(n=>n+1)}>Réessayer</button> <a href={src} target="_blank" rel="noopener noreferrer">Ouvrir le PDF original</a></div>}
  <div className="pdf-stage" ref={container} tabIndex={0} aria-label="Document PDF" aria-busy={loading||rendering}><div className="pdf-sheet" ref={sheet}/></div>
  {pdf&&!error&&<div className="pdf-bottom"><span role="status">Page {page} sur {pdf.numPages}{rendering?' · Affichage…':''}</span>{page===pdf.numPages&&onFinish&&<button type="button" className="button outline" onClick={onFinish}>{finishLabel||'Terminer la lecture'}</button>}</div>}
 </div>;
}
