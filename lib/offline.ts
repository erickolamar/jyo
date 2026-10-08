import {db} from './server';
export async function offlineKeys(){
 let row=await db().prepare("SELECT value FROM settings WHERE key='offline_signing_key'").first<{value:string}>();
 if(!row){const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);const value=JSON.stringify({privateKey:await crypto.subtle.exportKey('jwk',keys.privateKey),publicKey:await crypto.subtle.exportKey('jwk',keys.publicKey)});await db().prepare("INSERT OR IGNORE INTO settings(key,value) VALUES('offline_signing_key',?)").bind(value).run();row=await db().prepare("SELECT value FROM settings WHERE key='offline_signing_key'").first<{value:string}>()}
 return JSON.parse(row!.value) as {privateKey:JsonWebKey;publicKey:JsonWebKey};
}
