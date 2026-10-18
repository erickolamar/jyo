'use client';
import {useState} from 'react';
import {Gift,Clock3,Crown,ArrowUpRight} from 'lucide-react';
import ReadingDialog from './reading-dialog';
import GiftFlow from './gift-flow';
import type {Row} from './ui';
export default function JyoShare({me,works,onClose}:{me:Row;works:Row[];onClose:()=>void}){
 const [offer,setOffer]=useState(''),[notice,setNotice]=useState(''),[showLink,setShowLink]=useState(false),url=typeof location==='undefined'?'':location.origin+'/',text='Découvrez JYO — Ici, on va plus loin…';
 if(offer)return <GiftFlow me={me} works={works} context="jyo" initialType={offer} onClose={()=>setOffer('')}/>;
 return <ReadingDialog title="Partager JYO" onDismiss={onClose}><div className="jyo-share-intro"><Gift size={28}/><p>Une découverte à transmettre, un abonnement à offrir.</p></div><div className="share-simple-actions"><a className="button outline" href={'https://wa.me/?text='+encodeURIComponent(text+'\n'+url)} target="_blank" rel="noopener noreferrer">WhatsApp<ArrowUpRight size={14}/></a><a className="button outline" href={'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)} target="_blank" rel="noopener noreferrer">Facebook<ArrowUpRight size={14}/></a><button className="button outline" onClick={async()=>{try{await navigator.clipboard.writeText(url);setNotice('Lien JYO copié.')}catch{setShowLink(true)}}}>Copier le lien JYO</button></div>{notice&&<p role="status">{notice}</p>}{showLink&&<input readOnly value={url} onFocus={e=>e.target.select()}/>}<div className="jyo-gift-options"><button onClick={()=>setOffer('SUBSCRIPTION')}><Crown size={24}/><span><strong>Offrir un abonnement</strong><small>{me.admin?'Classique ou Premium · Sans paiement':'Classique ou Premium · Pour une ou plusieurs personnes'}</small></span><span aria-hidden="true">→</span></button>{me.admin&&<button onClick={()=>setOffer('JYO_DAYS')}><Clock3 size={24}/><span><strong>Offrir des jours JYO</strong><small>Durée personnalisée · Cadeau administrateur</small></span><span aria-hidden="true">→</span></button>}</div></ReadingDialog>
}
