'use client';
import {useState} from 'react';
import {api,type Row} from './ui';
import {localRows} from './jyo-client';
export default function RereadButton({work,state,owner,onChanged}:{work:Row;state:Row;owner:string;onChanged?:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <><button className="button primary" disabled={busy} title="Votre historique et votre temps de lecture restent conservés." onClick={async()=>{setBusy(true);setError('');try{const result=await api('/api/reading-rounds',{work_id:work.id,round:state.reading_round||1});try{const rows=localRows(owner);for(const [id,row] of Object.entries(rows))if(row.work_id===work.id)delete rows[id];localStorage.setItem('jyo-progress:'+owner,JSON.stringify(rows))}catch{}await onChanged?.();location.assign(result.return_to)}catch(e){setError((e as Error).message);setBusy(false)}}}>{busy?'Préparation…':'Relire · '+((state.reading_round||1)+1)+'ᵉ lecture'}</button>{error&&<p role="alert">{error}</p>}</>;
}
