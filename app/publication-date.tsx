'use client';
import {useEffect,useState} from 'react';
import {publicationLabel} from '../lib/publication-date';
export default function PublicationDate({value}:{value?:string}){const [locale,setLocale]=useState('fr-FR');useEffect(()=>setLocale(navigator.language||'fr-FR'),[]);const label=publicationLabel(value,locale);return label?<small className="publication-date"><time dateTime={value}>Publié le {label}</time></small>:null}
