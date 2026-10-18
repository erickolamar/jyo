import {plans} from './editorial';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export const PRICE=1500;
export function db(){if(!env.DB)throw new Error('Base de données indisponible.');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new Error('Stockage indisponible.');return env.BUCKET;}
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export function config(key:string){return (env as unknown as Record<string,string>)[key] || process.env[key] || '';}
export async function identity(required=false){const u=await getChatGPTUser();if(required&&!u)throw new HttpError(401,'Connectez-vous pour continuer.');if(u)await db().prepare('INSERT INTO users (id,email,name,created_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,name=excluded.name').bind(u.userId,u.email,u.displayName,Date.now()).run();return u;}
export async function admin(){const u=await identity(true);if(!config('ADMIN_EMAIL')||u!.email.toLowerCase()!==config('ADMIN_EMAIL').toLowerCase())throw new HttpError(403,'Accès réservé à l’administration.');return u!;}
export async function isAdministrator(userId?:string){if(!userId||!config('ADMIN_EMAIL'))return false;return !!await db().prepare('SELECT id FROM users WHERE id=? AND lower(email)=lower(?)').bind(userId,config('ADMIN_EMAIL')).first();}
export async function isSubscribed(userId?:string){if(!userId)return false;const r=await db().prepare('SELECT ends_at FROM subscriptions WHERE user_id=?').bind(userId).first<{ends_at:number}>();return !!r&&r.ends_at>Date.now();}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new HttpError(403,'Origine de la requête refusée.');}
export const visible="(status='PUBLISHED' OR (status='SCHEDULED' AND publish_at IS NOT NULL AND publish_at <= ?))";
export async function publicSettings(){const rows=await db().prepare("SELECT key,value FROM settings WHERE key IN ('mtn','orange','beneficiary')").all<{key:string,value:string}>();const s=Object.fromEntries(rows.results.map(r=>[r.key,r.value]));return {mtn:s.mtn||'',orange:s.orange||'',beneficiary:s.beneficiary||'',price:PRICE,plans:await plans()};}
export async function route(fn:()=>Promise<Response>){try{return await fn();}catch(e){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});console.error(e);return Response.json({error:'Le service est temporairement indisponible. Réessayez.'},{status:503});}}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
export async function body(req:Request){if(Number(req.headers.get('content-length'))>2_000_000)throw new HttpError(413,'Contenu trop volumineux.');try{const b=await req.json();if(!b||typeof b!=='object'||Array.isArray(b))throw new Error();return b as Record<string,any>}catch{throw new HttpError(400,'Données invalides.')}}
export function str(v:unknown,max=1000){return typeof v==='string'?v.trim().slice(0,max):'';}
export function integer(v:unknown,min=0,max=1_000_000){const n=Number(v);if(!Number.isInteger(n)||n<min||n>max)throw new HttpError(400,'Nombre invalide.');return n;}
export function choice(v:unknown,allowed:string[]){if(typeof v!=='string'||!allowed.includes(v))throw new HttpError(400,'Choix invalide.');return v;}
export function returnPath(v:unknown){const p=str(v,400);return /^\/(lire|ecouter|regarder|read|listen|watch|j|work)\/[a-zA-Z0-9-]+$/.test(p)?p:'/library';}
