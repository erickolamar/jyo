 'use client';
import {useState} from 'react';
import {Search,ArrowUpRight} from 'lucide-react';
import ReadingDialog from './reading-dialog';
import WorkCover from './work-cover';
import {readingKind} from './jyo-client';
import type {Row} from './ui';
export default function CatalogSearch({data,onClose}:{data:Row;onClose:()=>void}){
 const [query,setQuery]=useState(''),[category,setCategory]=useState(''),[format,setFormat]=useState('ALL'),[sort,setSort]=useState('recent');
 const categories=[...new Set<string>(data.works.flatMap((w:Row)=>(w.categories||'').split(/[,;·]/).map((s:string)=>s.trim()).filter(Boolean)))];
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const rows=data.works.filter((w:Row)=>normalize(w.title+' '+w.author+' '+(w.categories||'')).includes(normalize(query.trim()))&&(!category||(w.categories||'').split(/[,;·]/).map((s:string)=>s.trim()).includes(category))&&(format==='ALL'||data.contents.some((c:Row)=>c.work_id===w.id&&readingKind(c)===format))).sort((a:Row,b:Row)=>sort==='rated'?(b.rating||0)-(a.rating||0):sort==='popular'?(b.readers||0)-(a.readers||0):Date.parse(b.publication_date||'')-Date.parse(a.publication_date||'')||b.created_at-a.created_at);
 return <ReadingDialog compact title="Trouver une œuvre" onDismiss={onClose}><div className="catalog-search-dialog"><label className="catalog-search-input"><Search size={20}/><input type="search" aria-label="Titre ou auteur" placeholder="Un titre, un auteur…" value={query} onChange={e=>setQuery(e.target.value)}/></label><details><summary>Affiner la recherche</summary><div className="catalog-search-options"><label>Catégorie<select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Toutes les catégories</option>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Format<select value={format} onChange={e=>setFormat(e.target.value)}><option value="ALL">Tous types</option><option value="TEXT">Lecture</option><option value="AUDIO">Audio</option><option value="VIDEO">Vidéo</option></select></label><label>Trier<select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Plus récentes</option><option value="popular">Plus lues</option><option value="rated">Mieux notées</option></select></label></div></details><p className="search-count" role="status">{rows.length} œuvre{rows.length!==1?'s':''}</p><div className="catalog-search-results">{rows.map((w:Row)=><a key={w.id} href={'/work/'+w.slug} onClick={onClose}><WorkCover work={w}/><span><strong>{w.title}</strong><small>{w.author}</small></span><ArrowUpRight size={18}/></a>)}{!rows.length&&<p>Aucune œuvre trouvée. Essayez un autre mot ou retirez un filtre.</p>}</div></div></ReadingDialog>
}
