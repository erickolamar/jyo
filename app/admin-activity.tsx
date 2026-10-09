 'use client';
import {useEffect,useState} from 'react';
import {api,type Row} from './ui';
export default function AdminActivity({initial,details=false}:{initial:Row;details?:boolean}){
 const [data,setData]=useState(initial),[error,setError]=useState('');
 useEffect(()=>{let alive=true;const refresh=()=>{if(document.hidden)return;api('/api/admin/activity').then(d=>{if(alive){setData(d);setError('')}}).catch(()=>{if(alive)setError('Actualisation indisponible ; derniers chiffres affichés.')})};const timer=setInterval(refresh,60000);return()=>{alive=false;clearInterval(timer)}},[]);
 if(!data)return null;return <section className="platform-activity" aria-label="Activité de la plateforme"><div className="activity-counters"><p><strong>{data.online}</strong> actifs ces 5 dernières minutes</p><p><strong>{data.subscribers}</strong> abonnés avec un accès valide</p></div>{details&&<><h2>Fréquentation</h2><div className="table-scroll"><table><thead><tr><th>Période</th><th>Visites</th><th>Visiteurs estimés</th><th>Pages vues</th></tr></thead><tbody>{data.windows.map((w:Row,i:number)=><tr key={i}><th>{["Aujourd’hui",'7 jours','30 jours'][i]}</th><td>{w.visits}</td><td>{w.visitors}</td><td>{w.views}</td></tr>)}</tbody></table></div><p className="subtle">Données depuis cette mise à jour. Visiteurs estimés par compte ou navigateur, avec une nouvelle visite après 30 minutes d’inactivité. Les visites de l’administration sont exclues.</p></>}{error&&<p role="status">{error}</p>}</section>
}
